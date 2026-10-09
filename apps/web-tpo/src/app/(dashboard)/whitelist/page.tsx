import type { Metadata } from 'next';
import { WhitelistWorkspace } from '../../../components/whitelist/WhitelistWorkspace';

export const metadata: Metadata = {
  title: 'Candidate Access & Invitations | HireKiwi TPO',
  description: 'Manage candidate access, invitation statuses, and institution domain rules.',
};

export default function WhitelistPage() {
  return <WhitelistWorkspace />;
}
