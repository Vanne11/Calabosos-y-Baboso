// components/Widgets/FormWidget.jsx
// Widget de formulario para capturar datos del jugador (nombre, género, etc.)

import React, { useState } from 'react';
import styled from 'styled-components';

const WidgetContainer = styled.div`
  padding: 1rem;
  margin: 1rem 0;
  background-color: ${props => props.theme.widgets.background};
  border-radius: 5px;
  border: 1px solid ${props => props.theme.widgets.border};
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.text};
  font-size: 1.1rem;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: ${props => props.theme.text};
  font-size: 0.95rem;
  font-weight: 500;
`;

const Input = styled.input`
  background-color: ${props => props.theme.terminal.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.widgets.border};
  border-radius: 3px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary};
    opacity: 0.6;
  }
`;

const Select = styled.select`
  background-color: ${props => props.theme.terminal.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.widgets.border};
  border-radius: 3px;
  padding: 0.75rem;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }

  option {
    background-color: ${props => props.theme.terminal.background};
    color: ${props => props.theme.text};
  }
`;

const SubmitButton = styled.button`
  background-color: ${props => props.theme.button.background};
  color: ${props => props.theme.button.text};
  border: none;
  border-radius: 3px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background-color: ${props => props.theme.button.hoverBackground};
  }

  &:active {
    background-color: ${props => props.theme.button.activeBackground};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.terminal.error};
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const FormWidget = ({ widget, onFormSubmit }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Debug: Log cuando el widget se renderiza
  console.log('FormWidget renderizado:', widget);

  if (!widget || !widget.fields || widget.fields.length === 0) {
    console.error('FormWidget: No hay campos definidos', widget);
    return null;
  }

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    widget.fields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        newErrors[field.name] = field.errorMessage || `${field.label} es requerido`;
      }

      if (field.minLength && formData[field.name]?.length < field.minLength) {
        newErrors[field.name] = `${field.label} debe tener al menos ${field.minLength} caracteres`;
      }

      if (field.maxLength && formData[field.name]?.length > field.maxLength) {
        newErrors[field.name] = `${field.label} debe tener máximo ${field.maxLength} caracteres`;
      }
    });

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (onFormSubmit) {
      onFormSubmit(formData, widget);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return (
          <FormGroup key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type="text"
              name={field.name}
              placeholder={field.placeholder || ''}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              maxLength={field.maxLength}
            />
            {errors[field.name] && (
              <ErrorMessage>{errors[field.name]}</ErrorMessage>
            )}
          </FormGroup>
        );

      case 'select':
        return (
          <FormGroup key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            >
              <option value="">{field.placeholder || 'Selecciona una opción'}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors[field.name] && (
              <ErrorMessage>{errors[field.name]}</ErrorMessage>
            )}
          </FormGroup>
        );

      default:
        return null;
    }
  };

  return (
    <WidgetContainer>
      {widget.title && <Title>{widget.title}</Title>}
      <FormContainer onSubmit={handleSubmit}>
        {widget.fields.map(field => renderField(field))}
        <SubmitButton type="submit">
          {widget.submitText || 'Continuar'}
        </SubmitButton>
      </FormContainer>
    </WidgetContainer>
  );
};

export default FormWidget;
