'use client';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { MetalTypeFilter } from '@/lib/metalType';

interface MetalTypeToggleProps {
  value: MetalTypeFilter;
  onChange: (value: MetalTypeFilter) => void;
  fullWidth?: boolean;
}

export default function MetalTypeToggle({
  value,
  onChange,
  fullWidth = true,
}: MetalTypeToggleProps) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, nextValue: MetalTypeFilter | null) => {
        if (nextValue) {
          onChange(nextValue);
        }
      }}
      size="small"
      fullWidth={fullWidth}
      color="primary"
    >
      <ToggleButton value="all">Tümü</ToggleButton>
      <ToggleButton value="altın">Altın</ToggleButton>
      <ToggleButton value="gümüş">Gümüş</ToggleButton>
    </ToggleButtonGroup>
  );
}
