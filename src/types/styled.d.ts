// types/styled.d.ts
// Declaración de tipos para styled-components

import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}
