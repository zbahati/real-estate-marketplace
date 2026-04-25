import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT } from '../theme';

export interface InputProps extends TextInputProps {}

export default function Input(props: InputProps) {
  const { style, ...rest } = props;
  return <TextInput style={[styles.input, style]} {...rest} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.body,
    marginBottom: SPACING.sm,
  },
});
