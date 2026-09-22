import React from 'react';
import { TasTripDashboard } from './TasTripDashboard';
import { Tenant, DeliveryDriver, TasteTripDeployment } from '../types';

interface TasteTripEcosystemProps {
  tenants: Tenant[];
  drivers: DeliveryDriver[];
  deployments: TasteTripDeployment[];
  onBackToDigitalRace?: () => void;
  onSelectTenant?: (tenantId: string) => void;
}

export const TasteTripEcosystem: React.FC<TasteTripEcosystemProps> = (props) => {
  return <TasTripDashboard {...props} />;
};

export { TasTripDashboard };
