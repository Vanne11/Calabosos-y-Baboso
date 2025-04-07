// components/Terminal/TerminalOutput.jsx
// Componente mejorado para mostrar la salida de la terminal con colores Rich style

import React from 'react';
import styled from 'styled-components';

const OutputContainer = styled.div`
  padding-right: 8px;
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: ${props => props.theme.terminal.text};
`;

const OutputLine = styled.div`
  margin-bottom: 4px;
  line-height: 1.4;
  /* Colores Rich style para diferentes tipos de mensajes */
  color: ${props => {
    switch (props.type) {
      case 'command':
        return props.theme.terminal.command;
      case 'error':
        return props.theme.terminal.error;
      case 'success':
        return props.theme.terminal.success;
      case 'system':
        return props.theme.terminal.system;
      case 'warning':
        return props.theme.terminal.warning;
      case 'info':
        return props.theme.terminal.info;
      default:
        return props.theme.terminal.text;
    }
  }};
  ${props => props.highlight && `
    background-color: ${props.theme.terminal.highlight};
    padding: 2px 4px;
    border-radius: 2px;
  `}
  ${props => props.bold && 'font-weight: bold;'}
  ${props => props.italic && 'font-style: italic;'}
  ${props => props.dim && 'opacity: 0.7;'}
`;

const CommandPrefix = styled.span`
  color: ${props => props.theme.terminal.prompt};
  margin-right: 8px;
  font-weight: bold;
`;

const DialogHeader = styled.div`
  margin-top: 12px;
  font-weight: bold;
  color: ${props => props.theme.terminal.character};
  border-bottom: 1px solid ${props => props.theme.terminal.characterBorder};
  padding-bottom: 2px;
  font-size: 1.05rem;
`;

const DialogLine = styled.div`
  margin-bottom: 12px;
  margin-top: 4px;
  padding: 12px 16px;
  background-color: ${props => props.theme.terminal.dialogBackground};
  border-radius: 6px;
  border-left: 3px solid ${props => props.theme.terminal.accent};
  color: ${props => props.theme.terminal.dialog};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1.5;
`;

const OptionLine = styled.div`
  color: ${props => props.theme.terminal.option};
  font-style: italic;
  margin-bottom: 8px;
  font-weight: bold;
`;

/// Componente para formatear textos con estilo tipo Rich
const RichText = ({ content }) => {
  if (typeof content !== 'string') {
    try {
      return <>{JSON.stringify(content)}</>;
    } catch (e) {
      return <span style={{ color: 'red' }}>[Contenido inválido]</span>;
    }
  }

  const formatSpecialText = (text) => {
    let formattedText = text;

    const patterns = [
      {
        // Enlaces tipo: [link=https://...]texto[/link]
        regex: /\[link=(.*?)\](.*?)\[\/link\]/g,
        replace: (match, href, content) =>
          `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color: #8be9fd; text-decoration: underline;">${content}</a>`
      },
      { regex: /\[red\](.*?)\[\/red\]/g, style: 'color: #FF5252;' },
      { regex: /\[green\](.*?)\[\/green\]/g, style: 'color: #4CAF50;' },
      { regex: /\[blue\](.*?)\[\/blue\]/g, style: 'color: #2196F3;' },
      { regex: /\[yellow\](.*?)\[\/yellow\]/g, style: 'color: #FFC107;' },
      { regex: /\[purple\](.*?)\[\/purple\]/g, style: 'color: #9C27B0;' },
      { regex: /\[cyan\](.*?)\[\/cyan\]/g, style: 'color: #00BCD4;' },
      { regex: /\[white\](.*?)\[\/white\]/g, style: 'color: #FFFFFF;' },
      { regex: /\[gray\](.*?)\[\/gray\]/g, style: 'color: #9E9E9E;' },
      { regex: /\[bold\](.*?)\[\/bold\]/g, style: 'font-weight: bold;' },
      { regex: /\[italic\](.*?)\[\/italic\]/g, style: 'font-style: italic;' },
      { regex: /\[dim\](.*?)\[\/dim\]/g, style: 'opacity: 0.7;' },
      { regex: /\[strike\](.*?)\[\/strike\]/g, style: 'text-decoration: line-through;' },
      { regex: /\[underline\](.*?)\[\/underline\]/g, style: 'text-decoration: underline;' },
      { regex: /\[highlight\](.*?)\[\/highlight\]/g, style: 'background-color: rgba(255, 255, 0, 0.3); padding: 0 2px;' },
    ];

    patterns.forEach(({ regex, style, replace }) => {
      if (replace) {
        formattedText = formattedText.replace(regex, replace);
      } else {
        formattedText = formattedText.replace(regex, (match, content) =>
          `<span style="${style}">${content}</span>`
        );
      }
    });

    // Emojis especiales
    formattedText = formattedText
      .replace(/:snail:/g, '🐌')
      .replace(/:slime:/g, '🧪')
      .replace(/:castle:/g, '🏰')
      .replace(/:sword:/g, '⚔️')
      .replace(/:shield:/g, '🛡️')
      .replace(/:magic:/g, '✨')
      .replace(/:skull:/g, '💀')
      .replace(/:key:/g, '🔑')
      .replace(/:door:/g, '🚪');

    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  return formatSpecialText(content);
};




// Componente para tablas Rich
const RichTable = styled.div`
  margin: 8px 0;
  border: 1px solid ${props => props.theme.terminal.tableBorder};
  border-radius: 4px;
  overflow: hidden;
`;

const TableRow = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.terminal.tableBorder};
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.header && `
    background-color: ${props.theme.terminal.tableHeader};
    font-weight: bold;
    color: ${props.theme.terminal.tableHeaderText};
  `}
  
  &:nth-child(even) {
    background-color: ${props => props.theme.terminal.tableRowEven};
  }
  
  &:nth-child(odd):not(:first-child) {
    background-color: ${props => props.theme.terminal.tableRowOdd};
  }
`;

const TableCell = styled.div`
  padding: 6px 10px;
  flex: ${props => props.width || 1};
  text-align: ${props => props.align || 'left'};
  overflow: hidden;
  text-overflow: ellipsis;
  border-right: 1px solid ${props => props.theme.terminal.tableBorderLight};
  
  &:last-child {
    border-right: none;
  }
`;

const TerminalOutput = ({ history, renderCustomContent }) => {
  if (!history) return null;
  
  // Renderizar tablas especiales
  const renderRichTable = (entry) => {
    if (!entry.table) return null;
    
    return (
      <RichTable>
        {entry.table.header && (
          <TableRow header>
            {entry.table.header.map((cell, idx) => (
              <TableCell key={idx} width={entry.table.widths?.[idx]} align={entry.table.aligns?.[idx]}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        )}
        {entry.table.rows.map((row, rowIdx) => (
          <TableRow key={rowIdx}>
            {row.map((cell, cellIdx) => (
              <TableCell key={cellIdx} width={entry.table.widths?.[cellIdx]} align={entry.table.aligns?.[cellIdx]}>
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </RichTable>
    );
  };
  
  return (
    <OutputContainer>
      {history.map((entry, index) => {
        // Si es una tabla Rich, renderizarla
        if (entry.type === 'table') {
          return <div key={index}>{renderRichTable(entry)}</div>;
        }
        
        // Renderizado condicional según el tipo de entrada
        switch (entry.type) {
          case 'command':
            return (
              <OutputLine key={index} type={entry.type}>
                <CommandPrefix>&gt;</CommandPrefix>
                <RichText content={entry.content} />
              </OutputLine>
            );
          
          case 'dialogHeader':
            return (
              <DialogHeader key={index}>
                <RichText content={entry.content} />
              </DialogHeader>
            );
          
          case 'dialog':
            return (
              <DialogLine key={index}>
                <RichText content={entry.content} />
              </DialogLine>
            );
          
          case 'option':
            return (
              <OptionLine key={index}>
                <RichText content={entry.content} />
              </OptionLine>
            );
          
          default:
            return (
              <OutputLine 
                key={index} 
                type={entry.type}
                bold={entry.bold}
                italic={entry.italic}
                dim={entry.dim}
                highlight={entry.highlight}
              >
                <RichText content={entry.content} />
              </OutputLine>
            );
        }
      })}
      
      {/* Renderizar cualquier contenido adicional (como opciones) */}
      {renderCustomContent && renderCustomContent()}
    </OutputContainer>
  );
};

export default TerminalOutput;