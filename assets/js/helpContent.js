const ICONS = {
  editar: `
    <svg class="icnInsideHelp" viewBox="0 0 512 512" fill="currentColor">
      <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>
    </svg>
  `,
  excluir: `
    <svg class="icnInsideHelp" viewBox="-32 0 512 512" fill="currentColor">
      <path d="M170.5 51.6L151.5 80l145 0-19-28.4c-1.5-2.2-4-3.6-6.7-3.6l-93.7 0c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80 368 80l48 0 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-8 0 0 304c0 44.2-35.8 80-80 80l-224 0c-44.2 0-80-35.8-80-80l0-304-8 0c-13.3 0-24-10.7-24-24S10.7 80 24 80l8 0 48 0 13.8 0 36.7-55.1C140.9 9.4 158.4 0 177.1 0l93.7 0c18.7 0 36.2 9.4 46.6 24.9zM80 128l0 304c0 17.7 14.3 32 32 32l224 0c17.7 0 32-14.3 32-32l0-304L80 128zm80 64l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0l0 208c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-208c0-8.8 7.2-16 16-16s16 7.2 16 16z"/>
    </svg>
  `,
  gerador: `
    <svg class="icnInsideHelp" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12Z" fill="currentColor"></path>
      <path d="M9 13C9.55228 13 10 12.5523 10 12C10 11.4477 9.55228 11 9 11C8.44771 11 8 11.4477 8 12C8 12.5523 8.44771 13 9 13Z" fill="currentColor"></path>
      <path d="M14 12C14 12.5523 13.5523 13 13 13C12.4477 13 12 12.5523 12 12C12 11.4477 12.4477 11 13 11C13.5523 11 14 11.4477 14 12Z" fill="currentColor"></path>
      <path d="M20 11H16V13H20V11Z" fill="currentColor"></path>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M2 6C0.895431 6 0 6.89543 0 8V16C0 17.1046 0.89543 18 2 18H22C23.1046 18 24 17.1046 24 16V8C24 6.89543 23.1046 6 22 6H2ZM22 8H2L2 16H22V8Z" fill="currentColor"></path>
    </svg> 
  `,
};

const HELP_CONTENT = {
  "minhas-cifras": `
    <h2><strong>Minhas cifras</strong></h2>
    <p>Esta tela exibe todas as cifras salvas pelo usuário. </p>
    <p>Aqui você pode:</p>
    <ul>
    <li>Visualizar suas cifras na lista Minhas Cifras</li>
    <li>Criar uma nova cifra ao clicar em ‘+ Cifrar’</li>
    <li>Decifrar uma cifra ao clicar em ‘+ Decifrar’ ou no <i>card</i> da cifra correspondente</li>
    <li>Acessar uma cifra existente para visualizar ou editar, clicando no ícoone ${ICONS.editar} </li>
    <li>Excluir uma cifra existente ao clicar no ícone ${ICONS.excluir}</li>
    </ul>
    `,

  "cifragem": `
    <h2><strong>Cifragem</strong></h2>
    <p>Esta tela é utilizada para transformar um texto aberto em um código protegido (cifra).</p>
    <p>Você deve preencher três elementos principais: nos campos abaixo, a <strong>chave</strong> e a <strong>mensagem</strong> a ser cifrada.</p>
    <p>Depois, clique no botão Cifrar. O app abrirá uma janela para você fornecer sua frase segredo.</p>

    <h3><strong>Chave</strong></h3>
    <p>A chave é um dos elementos fundamentais da cifragem. Ela funciona como um “identificador técnico” da cifra e participa diretamente do processo criptográfico.</p>
    <p>Regras para a chave:</p>
    <ul>
    <li>Deve ter entre <strong>8 e 25 caracteres</strong>, </li>
    <li>Pode conter letras, números e símbolos comuns do teclado. </li>
    </ul>
    <p>Dicas importantes:</p>
    <ul>
    <li>Evite chaves muito óbvias (como “12345678” ou “senha123”), </li>
    <li>Use combinações variadas (letras maiúsculas, minúsculas, números e símbolos), </li>
    <li>Não reutilize a mesma chave em todas as cifras, se possível. </li>
    </ul>
    <p>Não se preocupe em memorizar a chave, pois ela será salva junto com a sua cifra.</p>

    <h3><strong>Mensagem (texto a ser cifrado)</strong></h3>
    <p>Este é o conteúdo que você deseja proteger. Você pode digitar ou colar qualquer texto, inclusive com quebras de linha.</p>

    <h3><strong>Frase segredo</strong></h3>
    <p>A frase segredo é um elemento essencial para a segurança da sua cifra. Ela funciona como uma camada adicional de proteção, combinada com a chave e a mensagem no processo de criptografia.</p>
    <p>Diferente da chave, a frase segredo <strong>não é armazenada pelo aplicativo em nenhum momento</strong>.</p>
    <p>Isso significa que:</p>
    <ul>
    <li>o sistema <strong>não guarda</strong>, <strong>não registra</strong> e <strong>não tem como recuperar</strong> essa informação, </li>
    <li>apenas você conhece a frase segredo utilizada. </li>
    </ul>
    <div class="note note-important">
    <h3><strong>Importante:</strong></h3>
    <p>Se você esquecer a frase segredo, não será possível decifrar a mensagem.</p>
    <p>Por isso, você deve:</p>
    <ul>
    <li>memorizar a frase segredo, ou </li>
    <li>anotá-la em um local seguro. </li>
    </ul>
    <p>Você também pode utilizar uma frase segredo diferente para cada cifra, aumentando ainda mais a segurança. </p>
    </div>
    <h3><strong>Como escolher uma boa frase segredo</strong></h3>
    <p>Uma boa frase segredo deve ser:</p>
    <ul>
    <li>fácil para você lembrar, </li>
    <li>mas difícil para outras pessoas adivinharem. </li>
    </ul>
    <p>Recomendações:</p>
    <ul>
    <li>Utilize <strong>pelo menos 3 palavras</strong> (mínimo recomendado), </li>
    <li>O ideal é entre <strong>4 e 5 palavras</strong>, </li>
    <li>Um total de cerca de <strong>20 caracteres ou mais</strong> já oferece uma boa segurança. </li>
    </ul>
    <p>Sugestões do que usar:</p>
    <ul>
    <li>Nome de uma pessoa famosa, </li>
    <li>Trecho ou título de uma música, </li>
    <li>Nome de um filme, </li>
    <li>Trecho ou título de um livro, </li>
    <li>Nome de autor, cantor ou artista, </li>
    <li>Uma frase que você goste ou que tenha significado para você. </li>
    </ul>
    <div class="note note-caution">
    <h3><strong>Cuidados importantes</strong></h3>
    <p>Evite escolher frases que sejam facilmente associadas a você.</p>
    <p>Exemplo:<br>Se você é conhecido por gostar muito de uma música específica, usar um trecho dessa música pode facilitar que alguém tente adivinhar sua frase segredo.</p>
    <p>A ideia é encontrar um equilíbrio:</p>
    <ul>
    <li>algo que seja <strong>memorizável para você</strong>, </li>
    <li>mas <strong>não óbvio para outras pessoas</strong>.</li>
    </ul>
    </div>
    <h3><strong>Opções de Chave</strong></h3>
    <p>Na tela <strong>Cifrar</strong>, você pode definir a chave de diferentes formas, utilizando as opções disponíveis. Isso permite escolher entre praticidade, reutilização ou maior controle manual.</p>
    <h4><strong>Digitar, colar ou gerar chave</strong></h4>
    <p>Esta é a forma mais direta de definir a chave.</p>
    <p>Você pode:</p>
    <ul>
    <li><strong>Digitar manualmente</strong> a chave no campo, </li>
    <li><strong>Colar</strong> um texto da sua área de transferência, </li>
    <li>Ou utilizar o botão <strong>“Gerar senha aleatória”</strong>. </li>
    </ul>
    <p>Ao optar por gerar uma chave automaticamente, o aplicativo cria uma sequência <strong>aleatória de 25 caracteres</strong><strong> </strong>utilizando letras, números e símbolos. </p>
    <p>Essa é uma excelente opção para quem deseja:</p>
    <ul>
    <li>máxima segurança, </li>
    <li>evitar padrões previsíveis, </li>
    <li>e não precisa memorizar a chave (caso esteja salvando a cifra no aplicativo). </li>
    </ul>
    <div class="spacer"></div>
    <h4><strong>Leitura por QR Cod</strong><strong>e</strong></h4>
    <p>O Cifrei também permite utilizar uma chave por meio da leitura de um <strong>QR Code</strong>.</p>
    <p>Funciona assim:</p>
    <ul>
    <li>O aplicativo pode gerar um QR Code associado a uma cifra, </li>
    <li>Você pode salvar esse QR Code no seu celular ou computador, </li>
    <li>E, posteriormente, utilizá-lo para preencher a chave automaticamente na tela de cifragem. </li>
    </ul>
    <p>Para isso, selecione a opção de leitura por QR Code e utilize a câmera do dispositivo para ler o código. </p>
    <p>Essa opção é útil quando você deseja:</p>
    <ul>
    <li>evitar digitação manual, </li>
    <li>reduzir erros, </li>
    <li>ou utilizar chaves complexas de forma prática. </li>
    </ul>
    <div class="spacer"></div>
    <h4><strong>Selecionar chave de uma cifra salva</strong></h4>
    <p>Você também pode reutilizar a chave de uma cifra já existente. Ao escolher essa opção, o aplicativo lista suas cifras salvas e você pode selecionar uma delas para utilizar a mesma chave. </p>
    <p>Essa funcionalidade é útil quando:</p>
    <ul>
    <li>você trabalha com um conjunto de cifras relacionadas, </li>
    <li>deseja manter um padrão de chave, </li>
    <li>ou quer agilizar o processo de cifragem. </li>
    </ul>
    <div class="spacer"></div>
    <h3><strong>Considerações gerais</strong></h3>
    <p>Cada forma de definir a chave atende a um perfil de uso:</p>
    <ul>
    <li><strong>Manual/gerada:</strong> mais flexível e segura </li>
    <li><strong>QR Code:</strong> mais prática e precisa </li>
    <li><strong>Cifra salva:</strong> mais rápida e consistente </li>
    </ul>
    <p>A escolha depende do seu fluxo de uso e do nível de segurança desejado.</p>
    <h3><strong>Uso prático: armazenamento seguro de senhas</strong></h3>
    <p>O Cifrei também pode ser utilizado como uma ferramenta para armazenar senhas de forma segura.</p>
    <p>Nesse caso, em vez de cifrar um texto comum, você pode gerar e proteger <strong>senhas de acesso a sites e aplicativos</strong>.</p>
    <h4><strong>Gerando uma senha segura</strong></h4>
    <p>Na tela <strong>Cifragem</strong>, no campo de mensagem, você pode utilizar o gerador de senha do aplicativo. Para isso, clique no ícone ${ICONS.gerador}, localizado no canto superior direito do campo de mensagem (representado por um campo de senha com caracteres ocultos). Será aberta uma janela de configuração. </p>
    <p>Nessa janela, você poderá definir:</p>
    <ul>
    <li>o <strong>tamanho da senha</strong> (quantidade de caracteres), </li>
    <li>se deseja incluir <strong>letras maiúsculas</strong>, </li>
    <li><strong>números</strong>, </li>
    <li>e <strong>caracteres especiais</strong>. </li>
    </ul>
    <p>Isso permite adaptar a senha exatamente às exigências do site ou aplicativo em que ela será utilizada.</p>
    <p>Após configurar, o aplicativo gera automaticamente uma senha forte e aleatória, que poderá ser usada no campo de mensagem.</p>
    <h4><strong>Salvando a senha como cifra</strong></h4>
    <p>Depois de gerar a senha:</p>
    <ul>
    <li>você realiza a cifragem normalmente, </li>
    <li>atribui um nome à cifra (por exemplo, o nome do site ou aplicativo), </li>
    <li>e salva. </li>
    </ul>
    <p>A senha ficará armazenada de forma protegida dentro do Cifrei.</p>
      `,

  "decifragem": `
      <h2><strong>Decifragem</strong></h2>
      <p>Esta tela <strong>Decifragem</strong> é utilizada para recuperar uma mensagem protegida anteriormente no Cifrei.</p>
      <p>Para isso, o usuário deve informar os elementos necessários da cifra, especialmente a <strong>chave</strong>, o <strong>código</strong> e a <strong>frase segredo</strong> correspondente.</p>
      <h3><strong>Formas de informar a chave e o código</strong></h3>
      <p>Na tela <strong>Decifragem</strong>, o usuário pode optar por diferentes caminhos para fornecer os dados da cifra:</p>
      <h4><strong>Digitação manual</strong></h4>
      <p>O usuário precisa:</p>
      <ul>
      <li>digitar manualmente a <strong>chave</strong>, </li>
      <li>ou colar a <strong>chave</strong> e o <strong>código</strong> a partir da área de transferência, </li>
      <li>clicar no botão <strong>Decifrar</strong></li>
      <li>e então informar na janela que se abre a <strong>frase segredo</strong> utilizada no momento da cifragem. </li>
      </ul>
      <p>Essa opção é útil quando a cifra foi armazenada fora do aplicativo ou quando o usuário deseja inserir os dados diretamente.</p>
      <h4><strong>Leitura por QR Code</strong></h4>
      <p>O usuário também pode utilizar a leitura de um <strong>QR Code</strong> Cifrei.</p>
      <p>Nesse caso:</p>
      <ul>
      <li>basta selecionar a opção correspondente, </li>
      <li>usar a câmera do dispositivo, </li>
      <li>ler o QR Code associado à cifra, </li>
      <li>clicar no botão <strong>Decifrar</strong></li>
      <li>e então informar na janela que se abre a <strong>frase segredo</strong> utilizada no momento da cifragem. </li>
      </ul>
      <p>Essa opção reduz erros de digitação e facilita o uso de chaves mais complexas.</p>
      <h4><strong>Seleção de cifra salva</strong></h4>
      <p>Outra possibilidade é selecionar uma cifra já salva no próprio aplicativo.</p>
      <p>Ao escolher essa opção:</p>
      <ul>
      <li>o aplicativo recupera a cifra armazenada, </li>
      <li>preenchendo os dados necessários para a decifragem, </li>
      <li>restando ao usuário clicar no botão <strong>Decifrar</strong></li>
      <li>e informar na janela que se abre a <strong>frase segredo</strong> utilizada no momento da cifragem. </li>
      </ul>
      <p>Essa é a forma mais prática para quem utiliza o Cifrei como arquivo pessoal de cifras.</p>
      <h3><strong>Resultado da decifragem</strong></h3>
      <p>Após informar os dados necessários, clicar em <strong>Decifrar</strong> e informar a frase segredo, o aplicativo processa a cifra e, se as informações estiverem corretas, abre a tela com a <strong>cifra aberta</strong>.</p>
  `,
  "meu-perfil": `
      <h2><strong>Meu Perfil</strong></h2>
      <p>Esta tela <strong>Meu Perfil</strong> permite ao usuário gerenciar suas informações pessoais e configurações de conta.</p>
      <h3><strong>Dados pessoais</strong></h3>
      <p>O usuário pode visualizar e editar seu nome e sobrenome.</p>
      <p>Após realizar alterações, basta clicar em <strong>Salvar</strong> para atualizar os dados.</p>
      <h3><strong>Redefinição de senha</strong></h3>
      <p>Caso necessário, o usuário pode solicitar a redefinição de sua senha de acesso ao aplicativo.</p>
      <p>Ao iniciar esse processo:</p>
      <ul>
      <li>será enviado um link para o e-mail cadastrado, </li>
      <li>permitindo a criação de uma nova senha. </li>
      </ul>
      <div class="spacer"></div>
      <h3><strong>Exclusão de conta</strong></h3>
      <p>O usuário também pode solicitar a exclusão da sua conta.</p>
      <p>Nesse caso:</p>
      <ul>
      <li>os dados pessoais são <strong>anonimizados</strong>, </li>
      <li>e as informações deixam de estar associadas ao usuário de forma identificável. </li>
      </ul>
      <p>Essa ação é irreversível e deve ser realizada com atenção.</p>
      <div class="note note-important">
      <h3><strong>⚠️</strong><strong> Importante</strong></h3>
      <p>A exclusão da conta não garante a recuperação de dados posteriormente. Certifique-se de que não há informações importantes que você deseja manter antes de prosseguir.</p>
      </div>
  `
};

HELP_CONTENT['minha-cifra'] = HELP_CONTENT['minhas-cifras'];
window.ICONS = ICONS;
window.HELP_CONTENT = HELP_CONTENT;
