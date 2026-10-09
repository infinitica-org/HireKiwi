import { configure } from '@testing-library/react';

// Increase Testing Library's default async query timeout from 1000ms to 5000ms for CI runners under load.
configure({ asyncUtilTimeout: 5000 });
