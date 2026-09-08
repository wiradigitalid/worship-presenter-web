import * as React from 'react';

/**
 * Traverses an element tree or node to extract value -> label mappings
 * from items (e.g. SelectItem) for SelectValue display.
 */
export function extractSelectItems(node: React.ReactNode): Map<string, React.ReactNode> {
  const acc = new Map<string, React.ReactNode>();
  function walk(n: React.ReactNode) {
    React.Children.forEach(n, (child) => {
      if (!React.isValidElement(child)) return;
      const props = child.props as Record<string, unknown> | undefined;
      // Match SelectItem elements or items declaring value and children without being a native input
      if (
        props &&
        'value' in props &&
        props.value !== undefined &&
        'children' in props &&
        !('type' in props && typeof props.type === 'string')
      ) {
        acc.set(String(props.value), props.children as React.ReactNode);
      }
      if (props && props.children) {
        walk(props.children as React.ReactNode);
      }
    });
  }
  walk(node);
  return acc;
}
