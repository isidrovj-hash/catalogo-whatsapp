// Deliberadamente NO llama a requireAdminUser(): esta es la única puerta de
// entrada al panel, así que no puede exigir autenticación para mostrarse a
// sí misma (eso crearía un bucle de redirección infinito).
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
