"""Product and ProductCategory repository."""

from typing import Optional, Sequence
from uuid import uuid4

from sqlalchemy import select, or_, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.db.repositories.base import BaseRepository, USE_CURRENT_TENANT
from src.models.product import Product, ProductCategory, TenantProduct
from src.models.module import Module, TenantModule
from src.core.tenancy import get_current_tenant_id


class ProductCategoryRepository(BaseRepository[ProductCategory]):
    """Repository for ProductCategory model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(ProductCategory, session)

    async def get_by_code(
        self, code: str, tenant_id: Optional[str] = USE_CURRENT_TENANT
    ) -> Optional[ProductCategory]:
        """Get category by code within tenant scope.

        For tenant-specific queries, also checks platform defaults (tenant_id=NULL).
        """
        if tenant_id == USE_CURRENT_TENANT:
            tenant_id = get_current_tenant_id()

        query = select(ProductCategory).where(
            ProductCategory.code == code,
            or_(
                ProductCategory.tenant_id == tenant_id,
                ProductCategory.tenant_id.is_(None),  # Platform defaults
            ),
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_categories_for_tenant(
        self, tenant_id: str, include_inactive: bool = False
    ) -> Sequence[ProductCategory]:
        """Get all categories available to a tenant (platform defaults + tenant-specific).

        Categories are returned sorted by sort_order.
        """
        query = select(ProductCategory).where(
            or_(
                ProductCategory.tenant_id == tenant_id,
                ProductCategory.tenant_id.is_(None),  # Platform defaults
            )
        )

        if not include_inactive:
            query = query.where(ProductCategory.is_active == True)

        query = query.order_by(ProductCategory.sort_order, ProductCategory.name)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_default_categories(
        self, include_inactive: bool = False
    ) -> Sequence[ProductCategory]:
        """Get all platform default categories (tenant_id=NULL)."""
        query = select(ProductCategory).where(ProductCategory.tenant_id.is_(None))

        if not include_inactive:
            query = query.where(ProductCategory.is_active == True)

        query = query.order_by(ProductCategory.sort_order, ProductCategory.name)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_default_category(self, data: dict) -> ProductCategory:
        """Create a platform default category (tenant_id=NULL)."""
        data["tenant_id"] = None
        return await self.create(data)


class ProductRepository(BaseRepository[Product]):
    """Repository for Product model operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    async def get_by_code(
        self,
        code: str,
        module_id: str,
        tenant_id: Optional[str] = USE_CURRENT_TENANT,
    ) -> Optional[Product]:
        """Get product by code within module and tenant scope."""
        if tenant_id == USE_CURRENT_TENANT:
            tenant_id = get_current_tenant_id()

        query = select(Product).where(
            Product.code == code,
            Product.module_id == module_id,
        )

        if tenant_id:
            # Look for tenant-specific or platform default
            query = query.where(
                or_(
                    Product.tenant_id == tenant_id,
                    Product.tenant_id.is_(None),
                )
            )
        else:
            # Platform default only
            query = query.where(Product.tenant_id.is_(None))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_with_relations(self, product_id: str) -> Optional[Product]:
        """Get product with module and category relations loaded."""
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.module),
                selectinload(Product.category_rel),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_products_for_tenant(
        self,
        tenant_id: str,
        module_id: Optional[str] = None,
        category_id: Optional[str] = None,
        risk_level: Optional[str] = None,
        visible_only: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[tuple[Product, Optional[TenantProduct]]]:
        """Get all products available to a tenant.

        Returns tuples of (Product, TenantProduct) where TenantProduct is the
        tenant's sync record for platform products (None for tenant-created products).

        Platform products are available if:
        - is_unlocked_for_all=True, OR
        - There's a TenantProduct record for this tenant

        Tenant-created products are available if tenant_id matches.
        """
        # Get enabled module IDs for this tenant (core + enabled via TenantModule)
        enabled_modules_query = select(Module.id).where(
            Module.is_active == True,
            or_(
                Module.is_core == True,
                Module.id.in_(
                    select(TenantModule.module_id).where(
                        TenantModule.tenant_id == tenant_id,
                        TenantModule.is_enabled == True,
                    )
                ),
            ),
        )

        # Subquery to get product IDs synced to this tenant via TenantProduct
        synced_product_ids = select(TenantProduct.product_id).where(
            TenantProduct.tenant_id == tenant_id
        )

        # Build query for platform products:
        # - is_unlocked_for_all=True (available to all), OR
        # - synced to this tenant via TenantProduct
        # Also include tenant-specific products
        query = select(Product, TenantProduct).outerjoin(
            TenantProduct,
            and_(
                TenantProduct.product_id == Product.id,
                TenantProduct.tenant_id == tenant_id,
            )
        ).where(
            and_(
                # 1. Module must be enabled for this tenant
                Product.module_id.in_(enabled_modules_query),
                # 2. Product must be available to this tenant
                or_(
                    # Platform products that are unlocked for all
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_default == True,
                        Product.is_unlocked_for_all == True,
                    ),
                    # Platform products synced to this tenant
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_default == True,
                        Product.id.in_(synced_product_ids),
                    ),
                    # Tenant-specific products
                    Product.tenant_id == tenant_id,
                )
            )
        )

        if module_id:
            query = query.where(Product.module_id == module_id)

        if category_id:
            query = query.where(Product.category_id == category_id)

        if risk_level:
            query = query.where(Product.risk_level == risk_level)

        if visible_only:
            # For platform products, check TenantProduct.is_visible if exists
            # For tenant products, check Product.is_visible
            query = query.where(
                or_(
                    # Tenant products - check Product.is_visible
                    and_(
                        Product.tenant_id == tenant_id,
                        Product.is_visible == True,
                    ),
                    # Platform products with is_unlocked_for_all:
                    # - If TenantProduct exists (tenant toggled visibility), use TenantProduct.is_visible
                    # - If no TenantProduct, use Product.is_visible (default)
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_unlocked_for_all == True,
                        or_(
                            # Tenant has a TenantProduct record - check its visibility
                            TenantProduct.is_visible == True,
                            # No TenantProduct record - check Product.is_visible
                            and_(
                                TenantProduct.id.is_(None),
                                Product.is_visible == True,
                            ),
                        ),
                    ),
                    # Platform products synced via TenantProduct (not unlocked_for_all)
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_unlocked_for_all == False,
                        TenantProduct.is_visible == True,
                    ),
                )
            )

        query = (
            query.options(
                selectinload(Product.module),
                selectinload(Product.category_rel),
            )
            .order_by(Product.category, Product.name)
            .offset(skip)
            .limit(limit)
        )

        result = await self.session.execute(query)
        return result.all()

    async def get_default_products(
        self,
        module_id: Optional[str] = None,
        visible_only: bool = True,
    ) -> Sequence[Product]:
        """Get all platform default products (tenant_id=NULL)."""
        query = select(Product).where(
            Product.tenant_id.is_(None),
            Product.is_default == True,
        )

        if module_id:
            query = query.where(Product.module_id == module_id)

        if visible_only:
            query = query.where(Product.is_visible == True)

        query = query.options(
            selectinload(Product.module),
            selectinload(Product.category_rel),
        ).order_by(Product.category, Product.name)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_default_product(self, data: dict) -> Product:
        """Create a platform default product (tenant_id=NULL, is_default=True)."""
        data["tenant_id"] = None
        data["is_default"] = True
        return await self.create(data)

    async def create_tenant_product(self, data: dict, tenant_id: str) -> Product:
        """Create a tenant-specific product."""
        data["tenant_id"] = tenant_id
        data["is_default"] = False
        return await self.create(data)

    async def copy_defaults_for_tenant(
        self, tenant_id: str, module_id: str
    ) -> Sequence[Product]:
        """Copy platform default products to a tenant.

        Creates tenant-specific copies of platform defaults for customization.
        Returns the newly created products.
        """
        # Get default products for the module
        defaults = await self.get_default_products(module_id=module_id)

        created_products = []
        for default_product in defaults:
            # Check if tenant already has this product
            existing = await self.get_by_code(
                default_product.code, module_id, tenant_id
            )
            if existing and existing.tenant_id == tenant_id:
                continue  # Skip if already exists as tenant product

            # Create tenant copy
            new_product_data = {
                "module_id": module_id,
                "tenant_id": tenant_id,
                "category_id": default_product.category_id,
                "code": default_product.code,
                "name": default_product.name,
                "name_zh": default_product.name_zh,
                "description": default_product.description,
                "description_zh": default_product.description_zh,
                "category": default_product.category,
                "risk_level": default_product.risk_level,
                "min_investment": default_product.min_investment,
                "currency": default_product.currency,
                "expected_return": default_product.expected_return,
                "is_visible": True,
                "is_default": False,
                "extra_data": default_product.extra_data,
            }
            new_product = await self.create(new_product_data)
            created_products.append(new_product)

        return created_products

    async def toggle_visibility(self, product: Product, is_visible: bool) -> Product:
        """Toggle product visibility."""
        return await self.update(product, {"is_visible": is_visible})

    async def get_products_by_module_codes(
        self,
        module_codes: list[str],
        tenant_id: str,
        visible_only: bool = True,
    ) -> dict[str, Sequence[Product]]:
        """Get products grouped by module code.

        Returns a dict with module_code as key and list of products as value.
        Only returns products for modules that are enabled for the tenant
        and products that are available to the tenant.
        """
        # Get enabled module IDs for this tenant (core + enabled via TenantModule)
        # filtered by the requested module codes
        enabled_modules_query = (
            select(Module)
            .where(
                Module.code.in_(module_codes),
                Module.is_active == True,
                or_(
                    Module.is_core == True,
                    Module.id.in_(
                        select(TenantModule.module_id).where(
                            TenantModule.tenant_id == tenant_id,
                            TenantModule.is_enabled == True,
                        )
                    ),
                ),
            )
        )
        module_result = await self.session.execute(enabled_modules_query)
        modules = {m.id: m.code for m in module_result.scalars().all()}

        if not modules:
            return {code: [] for code in module_codes}

        # Subquery to get product IDs synced to this tenant via TenantProduct
        synced_product_ids = select(TenantProduct.product_id).where(
            TenantProduct.tenant_id == tenant_id
        )

        # Build query for products available to tenant
        query = select(Product, TenantProduct).outerjoin(
            TenantProduct,
            and_(
                TenantProduct.product_id == Product.id,
                TenantProduct.tenant_id == tenant_id,
            )
        ).where(
            Product.module_id.in_(modules.keys()),
            or_(
                # Platform products that are unlocked for all
                and_(
                    Product.tenant_id.is_(None),
                    Product.is_default == True,
                    Product.is_unlocked_for_all == True,
                ),
                # Platform products synced to this tenant
                and_(
                    Product.tenant_id.is_(None),
                    Product.is_default == True,
                    Product.id.in_(synced_product_ids),
                ),
                # Tenant-specific products
                Product.tenant_id == tenant_id,
            )
        )

        if visible_only:
            # For platform products, check TenantProduct.is_visible if exists
            # For tenant products, check Product.is_visible
            query = query.where(
                or_(
                    # Tenant products - check Product.is_visible
                    and_(
                        Product.tenant_id == tenant_id,
                        Product.is_visible == True,
                    ),
                    # Platform products with is_unlocked_for_all:
                    # - If TenantProduct exists, use TenantProduct.is_visible
                    # - If no TenantProduct, use Product.is_visible (default)
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_unlocked_for_all == True,
                        or_(
                            TenantProduct.is_visible == True,
                            and_(
                                TenantProduct.id.is_(None),
                                Product.is_visible == True,
                            ),
                        ),
                    ),
                    # Platform products synced via TenantProduct (not unlocked_for_all)
                    and_(
                        Product.tenant_id.is_(None),
                        Product.is_unlocked_for_all == False,
                        TenantProduct.is_visible == True,
                    ),
                )
            )

        query = query.options(
            selectinload(Product.module),
            selectinload(Product.category_rel),
        ).order_by(Product.category, Product.name)

        result = await self.session.execute(query)
        rows = result.all()

        # Group by module code
        grouped: dict[str, list[Product]] = {code: [] for code in module_codes}
        for row in rows:
            product = row[0]
            module_code = modules.get(product.module_id)
            if module_code:
                grouped[module_code].append(product)

        return grouped

    # =========================================================================
    # TenantProduct Management (for platform products sync)
    # =========================================================================

    async def get_synced_tenant_ids(self, product_id: str) -> list[str]:
        """Get list of tenant IDs that have this product synced."""
        query = select(TenantProduct.tenant_id).where(
            TenantProduct.product_id == product_id
        )
        result = await self.session.execute(query)
        return [row[0] for row in result.all()]

    async def get_tenant_product(
        self, tenant_id: str, product_id: str
    ) -> Optional[TenantProduct]:
        """Get the TenantProduct record for a specific tenant and product."""
        query = select(TenantProduct).where(
            TenantProduct.tenant_id == tenant_id,
            TenantProduct.product_id == product_id,
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def sync_product_to_tenants(
        self, product_id: str, tenant_ids: list[str]
    ) -> list[TenantProduct]:
        """Sync a platform product to specified tenants.

        Creates TenantProduct records for each tenant. Skips if already exists.
        """
        created = []
        for tenant_id in tenant_ids:
            existing = await self.get_tenant_product(tenant_id, product_id)
            if existing:
                continue

            tp = TenantProduct(
                tenant_id=tenant_id,
                product_id=product_id,
                is_visible=True,
            )
            self.session.add(tp)
            created.append(tp)

        return created

    async def unsync_product_from_tenants(
        self, product_id: str, tenant_ids: list[str]
    ) -> int:
        """Remove product sync from specified tenants.

        Deletes TenantProduct records. Returns count of deleted records.
        """
        stmt = delete(TenantProduct).where(
            TenantProduct.product_id == product_id,
            TenantProduct.tenant_id.in_(tenant_ids),
        )
        result = await self.session.execute(stmt)
        return result.rowcount

    async def set_synced_tenants(
        self, product_id: str, tenant_ids: list[str]
    ) -> None:
        """Set the exact list of tenants synced to a product.

        Adds new syncs and removes old ones to match the provided list.
        """
        current_tenant_ids = set(await self.get_synced_tenant_ids(product_id))
        new_tenant_ids = set(tenant_ids)

        # Remove tenants no longer in the list
        to_remove = current_tenant_ids - new_tenant_ids
        if to_remove:
            await self.unsync_product_from_tenants(product_id, list(to_remove))

        # Add new tenants
        to_add = new_tenant_ids - current_tenant_ids
        if to_add:
            await self.sync_product_to_tenants(product_id, list(to_add))

    async def update_tenant_product_visibility(
        self, tenant_id: str, product_id: str, is_visible: bool
    ) -> Optional[TenantProduct]:
        """Update visibility for a tenant's synced product."""
        tp = await self.get_tenant_product(tenant_id, product_id)
        if not tp:
            return None

        tp.is_visible = is_visible
        return tp

    async def get_with_tenant_products(self, product_id: str) -> Optional[Product]:
        """Get product with tenant_products relationship loaded."""
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.module),
                selectinload(Product.category_rel),
                selectinload(Product.tenant_products),
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
