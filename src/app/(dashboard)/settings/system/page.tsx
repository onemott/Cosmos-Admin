import { SystemConfigEditor } from "@/components/system/config-editor";

export default function SystemSettingsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Manage global system configurations and legal documents.
        </p>
      </div>

      <div className="grid gap-6">
        <SystemConfigEditor
          configKey="privacy_policy"
          title="Privacy Policy"
          description="Edit the privacy policy content shown in the mobile app. Updating this will prompt users to re-accept the agreement."
        />
        
        <SystemConfigEditor
          configKey="terms_of_service"
          title="Terms of Service"
          description="Edit the terms of service content."
        />
      </div>
    </div>
  );
}
