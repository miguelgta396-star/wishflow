# ✨ WishFlow — Gestão Inteligente de Itens, Desejos & Conquistas

O **WishFlow** é uma aplicação web Full-Stack moderna projetada com foco em **retenção de usuários, clareza mental e experiência estética de alto padrão**. O app combina princípios de psicologia financeira, design minimalista (Glassmorphism + Neon Accents) e micro-interações viciantes.

---

## 🚀 Como Executar

### Opção 1: Via Servidor Flask Completo (Recomendado)
Abra o terminal na pasta do projeto e execute:
```bash
cd backend
python app.py
```
Em seguida, abra seu navegador em: **[http://localhost:5000](http://localhost:5000)**

*(No Windows, você também pode dar duplo clique no arquivo `iniciar.bat` na raiz do projeto!)*

### Opção 2: Acesso Direto (Zero Instalação / Modo Offline)
Você também pode abrir diretamente o arquivo `static/index.html` em qualquer navegador moderno. A aplicação conta com um motor reativo inteligente de fallback que ativa o `localStorage` automaticamente se não houver um servidor ativo, permitindo testar tudo imediatamente!

---

## 🎨 Arquitetura de UI/UX & Retenção

### 1. 🔐 Tela de Login e Cadastro (Glassmorphism & Gradiente Suave)
- **Design Minimalista**: Painel em vidro com desfoque de fundo (`backdrop-blur-md`), bordas translúcidas sutis e luzes de fundo difusas em gradiente.
- **Transição Fluida**: Alternância instantânea entre as abas *Entrar* e *Criar Conta*.
- **Acesso com 1 Clique**: Botão **"Entrar como Convidado (Modo Demonstração)"**, permitindo testar o produto instantaneamente sem fricção ou burocracia.

### 2. 🌟 Tutorial de Onboarding Interativo (Primeiro Acesso)
- Modal passo a passo em 4 etapas ilustradas:
  1. **Boas-vindas & Conceito**: Como a clareza visual combate a ansiedade e as compras por impulso.
  2. **O Segredo das 3 Categorias**: A separação inteligente entre *Tenho*, *Quero* e *Preciso*.
  3. **Arraste & Conquiste**: A gamificação de mover um desejo realizado para o inventário com comemoração de confetes.
  4. **Recursos & Ajuda Sempre à Mão**: Como usar fotos em alta resolução e acionar o botão flutuante de suporte.
- Indicadores de progresso visuais e possibilidade de pular ou rever o tour a qualquer momento.

### 3. 📊 Dashboard Central Dividido em Três Categorias Visuais
- 📦 **"Itens que eu tenho" (Inventário Atual)**:
  - Destacado em verde esmeralda.
  - Representa o patrimônio e os itens que o usuário já possui, estimulando a gratidão pelo que já foi conquistado.
- ✨ **"Itens que eu quero" (Lista de Desejos / Sonhos)**:
  - Destacado em violeta vibrante.
  - Lista de aspirações e desejos futuros. Contém o botão rápido **"Conquistei! 🎉"**, que dispara celebração com confetes e move o item diretamente para o inventário!
- ⚡ **"Itens que eu preciso" (Necessidades Imediatas)**:
  - Destacado em âmbar/dourado.
  - Foco em urgências, manutenções ou substituições essenciais, auxiliando na priorização orçamentária.

### 4. 🎛️ Recursos e Micro-Interações Viciantes
- **Arrastar e Soltar (Drag & Drop)**: Arraste qualquer item diretamente entre as colunas com feedback tátil visual.
- **Upload de Fotos**: Suporte a envio de imagens locais (com pré-visualização instantânea) ou seleção com 1 clique de presets fotográficos de inspiração (tecnologia, viagens, café, design, etc.).
- **Métricas no Topo**: Contadores em tempo real, **Taxa de Conquista (%)**, valor total estimado de desejos e indicador de clareza mental.
- **Filtros e Busca em Tempo Real**: Filtro instantâneo por texto, nível de prioridade (Alta, Média, Baixa) e ordenação por data, valor ou ordem alfabética.
- **Dark Mode & Light Mode**: Alternador elegante na barra superior.

### 5. 💡 Botão Flutuante de Ajuda Persistente ("Precisa de ajuda?")
- Posicionado estrategicamente no canto inferior direito com pulso suave de atenção.
- Ao clicar, abre uma **Central de Ajuda & Guia de Uso** completa:
  - Dúvidas Frequentes (FAQ) com sanfona/accordion interativo.
  - Explicação prática da regra 50/30/20 e diferenciação entre "Quero" e "Preciso".
  - Botão para rever o Tutorial de Boas-Vindas.
  - Botão para recarregar o conjunto de demonstração.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5 Semântico, Tailwind CSS, Lucide Icons, Canvas-Confetti, Web Audio API (haptics sintetizados).
- **Backend**: Python 3.12, Flask, SQLite 3 (WAL mode), Werkzeug Security (hashing seguro PBKDF2/sha256).
- **Persistência**: SQLite relacional estruturado com fallback inteligente em `localStorage`.
