// React 19 removeu o namespace global `JSX` — passou a estar em `React.JSX`.
// Este shim repõe o namespace global `JSX` (usado em vários ficheiros como
// `JSX.Element`) mapeando-o para `React.JSX`, evitando "Cannot find namespace 'JSX'".
import type * as React from 'react';

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
    type ElementClass = React.JSX.ElementClass;
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty;
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = React.JSX.IntrinsicElements;
  }
}
