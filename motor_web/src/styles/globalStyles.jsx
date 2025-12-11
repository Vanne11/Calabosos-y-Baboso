import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Courier New', monospace;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    line-height: 1.5;
    overflow: hidden;
  }

  /* Customize scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbar.track};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollbar.thumb};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.scrollbar.hover};
  }

  /* Hide scrollbar in Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${props => props.theme.scrollbar.thumb} ${props => props.theme.scrollbar.track};
  }
`;
