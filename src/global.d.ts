// Allow CSS side-effect imports in TypeScript
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
