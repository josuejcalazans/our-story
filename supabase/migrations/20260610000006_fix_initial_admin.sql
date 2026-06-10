
-- Permite que o primeiro usuário se torne admin se a tabela estiver vazia,
-- ou permite que o service_role (usado no dashboard do Supabase) ignore RLS.

-- Primeiro, vamos garantir que o service_role tenha acesso total (já deveria ter, mas por precaução)
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY; -- Garante que RLS se aplique inclusive ao dono, mas não ao service_role por padrão

-- Ajusta a política de inserção para permitir que o primeiro admin seja criado
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;

CREATE POLICY "Allow initial admin or admin management" 
ON public.user_roles FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Permite se não houver nenhum admin ainda (bootstrap)
  (NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'))
  OR 
  -- Ou se quem está inserindo já for um admin
  (public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admin update/delete roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
