import { PageHeader } from '@/components/page-header';
import { PageStack } from '@/components/admin-ui';
import { TwoFactorAuthCard } from '@/components/account/TwoFactorAuthCard';

export default function AdminSettingsPage() {
  return (
    <PageStack>
      <PageHeader
        title="Settings"
        description="Manage your own account security for this admin console."
      />
      <TwoFactorAuthCard />
    </PageStack>
  );
}
