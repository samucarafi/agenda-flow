# AgendaFlow

Aplicação de agendamento e gestão de negócios com Next.js App Router, React, TypeScript, Tailwind CSS, MongoDB e Mongoose.

## Desenvolvimento local

1. Instale as dependências com `npm install`.
2. Crie `.env.local` na raiz com as variáveis necessárias:

   ```env
   MONGODB_URI=mongodb+srv://...
   AUTH_SECRET=gere-um-segredo-aleatorio-com-pelo-menos-32-caracteres
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   ```

   Cloudinary é necessário para recursos de imagem. Mantenha segredos fora do Git e configure os valores equivalentes no ambiente de implantação.

3. Inicie com `npm run dev` e abra `http://localhost:3000`.

## Verificações

- TypeScript: `npx tsc --noEmit`
- ESLint: `npm run lint`
- Regras da fila: `npm test`
- Build de produção: `npm run build`

Os testes unitários usam o executor nativo `node:test`, sem dependência adicional. Valide também os fluxos abaixo em um ambiente de desenvolvimento ligado a um banco de teste antes de publicar.

## Operação de restaurantes

- Cadastre mesas com capacidade e mantenha sua disponibilidade atualizada.
- Adicione grupos manualmente ou permita que clientes autenticados entrem pela página pública.
- Chame grupos e acomode-os selecionando uma mesa compatível. A recomendação destaca o grupo ativo mais antigo que cabe na mesa; a equipe confirma cada atendimento.
- Quando o grupo sair, use **Confirmar desocupação** na tela Mesas. O sistema não libera mesas com base em tempo.
- A mesa só pode ser liberada se a associação com a entrada acomodada estiver consistente. Mesas de versões anteriores são associadas automaticamente quando existe exatamente uma entrada acomodada correspondente.
- Os estados finais da fila permanecem no histórico. A posição exibida para grupos ativos deriva da ordem de entrada, sem depender de reindexações concorrentes.

### Roteiro manual

1. Um cliente entra na fila e aparece no painel do restaurante.
2. A equipe chama o cliente e ele vê a atualização na página pública.
3. A equipe seleciona uma mesa compatível e confirma a acomodação.
4. A mesa mostra o grupo e passa a ocupada; uma segunda tentativa de ocupá-la deve falhar.
5. A equipe confirma a desocupação; a mesa volta a disponível e a entrada permanece no histórico.
6. A fila recomenda o grupo mais antigo que cabe na mesa liberada, sem acomodá-lo automaticamente.
7. Um cliente não consegue cancelar nem alterar a entrada de outra conta.
8. Uma conta de cliente não consegue criar duas entradas ativas simultâneas no mesmo restaurante.
9. Entradas maiores que a capacidade permanecem na fila sem serem reordenadas ou canceladas.
10. Repita atualização com a página aberta em duas sessões e recarregue para conferir a persistência.

## Banco de dados e implantação

O MongoDB configurado em `MONGODB_URI` precisa estar acessível pelo servidor Next.js. Ocupação e liberação usam uma sequência recuperável com filtros condicionais atômicos, pois alteram dois documentos e não dependem de transações multidocumento: uma referência de ocupação impede que outra solicitação tome a mesa; falhas comuns compensam a reserva; se o processo for interrompido, a equipe confirma a desocupação para reconciliar a entrada e liberar a mesa. Em uma implantação, garanta que os índices definidos nos schemas Mongoose sejam criados, especialmente o índice único parcial de `WaitlistEntry` para impedir entradas ativas duplicadas do mesmo cliente. Em ambientes que desativam `autoIndex`, aplique os índices por uma migração controlada antes de liberar o código.

Antes do deploy:

1. Configure `MONGODB_URI`, `AUTH_SECRET` e as variáveis Cloudinary no provedor.
2. Confirme o domínio em `NEXT_PUBLIC_APP_URL` e use HTTPS em produção.
3. Execute TypeScript, lint e build.
4. Faça o roteiro operacional acima com contas e dados de teste.
5. Publique primeiro em staging e verifique logs e índices do MongoDB.

Não compartilhe arquivos `.env.local`, credenciais ou dados reais nos logs.
