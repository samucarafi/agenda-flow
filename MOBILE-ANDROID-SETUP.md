# AgendaFlow Mobile — Android + Capacitor

## Arquitetura escolhida

- O Next.js continua hospedando a aplicação, autenticação, Server Actions e regras de negócio.
- O Capacitor cria o aplicativo Android nativo e carrega a URL HTTPS publicada do AgendaFlow.
- O Firebase Cloud Messaging (FCM) entrega push notifications.
- O MongoDB armazena dispositivos, notificações in-app e lembretes pendentes.
- Um endpoint protegido processa lembretes agendados.

O aplicativo não usa `output: "export"`: o AgendaFlow depende de recursos de servidor do Next.js.

## Atenção: etapa de protótipo Android

Esta primeira integração usa `server.url` para carregar o Next.js publicado dentro da WebView e validar autenticação, navegação e push no Android. A documentação do Capacitor apresenta `server.url` no fluxo de Live Reload/desenvolvimento; portanto, **não considere este wrapper remoto uma versão final pronta para publicar na Google Play**.

O Next.js atual depende de Server Actions e renderização no servidor, então não pode ser simplesmente exportado como um site estático completo. Antes da publicação, a decisão técnica será uma destas:

1. Criar uma interface mobile própria em React/Vite empacotada localmente pelo Capacitor, consumindo APIs autenticadas do Next.js; ou
2. Projetar e validar formalmente uma estratégia de WebView remota, incluindo segurança, experiência nativa e políticas da loja.

A opção 1 é a arquitetura de produção que recomendo. O pacote atual prepara a integração e os eventos de push sem fingir que o binário final já está pronto.

## 1. Instalar as dependências

Na raiz do projeto, execute:

```bash
npm install
```

O `package.json` inclui Capacitor 8, Android, Push Notifications e Firebase Admin. O `npm install` atualizará o `package-lock.json`.

## 2. Publicar o Next.js em HTTPS

O Capacitor precisa carregar uma URL HTTPS acessível pelo celular. Você pode começar com o domínio padrão fornecido pela hospedagem; não precisa comprar um domínio próprio nesta etapa.

Configure `NEXT_PUBLIC_APP_URL` com a URL pública do AgendaFlow no ambiente de produção.

## 3. Configurar Capacitor no PowerShell

Use a URL real publicada do seu projeto:

```powershell
$env:CAPACITOR_SERVER_URL = "https://SEU-PROJETO.vercel.app"
npx cap add android
npx cap sync android
npx cap open android
```

Substitua o endereço de exemplo pelo endereço real. Não deixe o texto `SEU-PROJETO`.

O `capacitor.config.ts` exige HTTPS, exceto para localhost em desenvolvimento. `mobile-shell/index.html` é apenas uma tela de contingência caso o app seja aberto sem uma URL configurada.

Depois de criar a pasta `android/`, mantenha-a no controle de versão. Não inclua `android/app/google-services.json` no Git.

## 4. Configurar Firebase Cloud Messaging para Android

1. Crie um projeto no Firebase.
2. Adicione um aplicativo Android com o identificador `com.agendaflow.app`.
3. Baixe o arquivo `google-services.json`.
4. Coloque-o em `android/app/google-services.json`.
5. No Firebase, gere uma chave de conta de serviço para o Admin SDK.
6. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` somente nas variáveis de ambiente do servidor de produção.

`FIREBASE_SERVICE_ACCOUNT_JSON` deve conter o JSON completo da conta de serviço em uma única variável de ambiente. Nunca use prefixo `NEXT_PUBLIC_`, nunca coloque a chave no aplicativo e nunca a envie ao repositório.

O token FCM de cada dispositivo é salvo na coleção `PushDevice` associado à conta autenticada. Ao sair da conta, o dispositivo é desativado no servidor.

## 5. Configurar o processamento de lembretes

Configure estas variáveis no servidor:

- `CRON_SECRET`: segredo aleatório longo, diferente de `AUTH_SECRET`.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: credencial privada do Firebase Admin SDK.

Configure um agendador no provedor de hospedagem para chamar, a cada minuto:

```text
GET https://SEU-DOMINIO/api/cron/process-notification-jobs
Authorization: Bearer SEU_CRON_SECRET
```

O endpoint é protegido e retorna HTTP 401 sem o cabeçalho correto. Não chame esse endpoint diretamente do navegador.

Os lembretes de 24 horas e 1 hora são criados quando um agendamento é criado ou reagendado. O worker verifica se o agendamento ainda existe e não foi cancelado antes de emitir o aviso.

## 6. Ativar notificações no app

Depois de instalar o app no dispositivo Android:

1. Entre com uma conta de cliente ou proprietário.
2. Na área autenticada, toque em **Ativar notificações**.
3. Autorize as notificações do Android.
4. Faça um teste com um dispositivo real e o Firebase configurado.

A central de notificações do AgendaFlow também guarda os avisos no MongoDB. O envio push depende da configuração FCM.

## 7. Eventos já conectados

- Cliente cria agendamento: recebe confirmação ou aviso de solicitação; proprietário recebe novo agendamento.
- Proprietário cria agendamento para cliente com conta vinculada: cliente recebe aviso.
- Cliente cancela ou reagenda: proprietário recebe aviso.
- Cliente entra na fila: proprietário recebe aviso.
- Proprietário chama o grupo: cliente recebe “É sua vez!”.
- Agendamento: são criados lembretes de 24h e 1h quando ainda há tempo para enviá-los.

## 8. Comandos úteis

```bash
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

Após alterações no código web, faça o deploy do Next.js. Como o app carrega a aplicação hospedada, a interface web atualizada ficará disponível sem publicar uma nova versão Android. Mudanças em plugins nativos ou configuração Android exigem novo `cap sync` e normalmente uma nova compilação do app.

## Limitações desta primeira etapa

- O pacote prepara Android primeiro; iOS não foi configurado nem testado.
- O push real depende de projeto Firebase, `google-services.json`, credencial Admin e URL HTTPS publicada.
- O processamento de lembretes depende de um cron externo configurado no provedor.
- Os avisos in-app aparecem na central autenticada; a tela completa de preferências e filtros fica para uma próxima etapa.
- Ainda é necessário gerar ícones/splash Android definitivos e testar em aparelhos físicos.
