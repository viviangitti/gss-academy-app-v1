import { Shield } from 'lucide-react';
import './Privacy.css';

export default function Privacy() {
  return (
    <div className="privacy-page">
      <div className="privacy-hero card">
        <Shield size={24} />
        <div>
          <h2>Política de Privacidade</h2>
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="privacy-content">
        <section>
          <h3>1. Quem somos</h3>
          <p>
            O <strong>MAESTR.IA em Vendas</strong> é um aplicativo da <strong>GSS Academy</strong>,
            desenvolvido como complemento do curso "MAESTR.IA em Vendas".
            O app oferece ferramentas com Inteligência Artificial para líderes comerciais e vendedores.
          </p>
        </section>

        <section>
          <h3>2. Dados que coletamos</h3>
          <p>Coletamos apenas o mínimo necessário para o app funcionar:</p>
          <ul>
            <li><strong>Perfil:</strong> nome, cargo, empresa e segmento de atuação (opcionais, preenchidos por você)</li>
            <li><strong>Meta mensal e vendas:</strong> quando você registra para acompanhar seu progresso</li>
            <li><strong>Atividades do dia:</strong> focos, tarefas, reuniões que você cria</li>
            <li><strong>Histórico de uso:</strong> mensagens analisadas, reuniões e treinos com a IA</li>
            <li><strong>Favoritos:</strong> objeções, roteiros e técnicas que você marca</li>
          </ul>
          <p>
            <strong>Não coletamos</strong> sua localização, contatos, fotos, número de telefone ou qualquer dado
            sensível não informado por você.
          </p>
        </section>

        <section>
          <h3>3. Onde seus dados ficam armazenados</h3>
          <p>
            Seus dados são armazenados de forma segura no <strong>Firebase (Google Cloud)</strong>, vinculados à sua conta.
            Isso garante que seus dados estejam disponíveis em qualquer dispositivo após o login.
          </p>
          <p>
            Uma cópia local também é mantida no seu dispositivo para funcionamento offline.
            Se você excluir sua conta, todos os seus dados são removidos permanentemente dos nossos servidores.
          </p>
        </section>

        <section>
          <h3>4. Uso de Inteligência Artificial</h3>
          <p>
            O app usa a API do <strong>Google Gemini</strong> para as funcionalidades de IA
            (Pergunte à IA, Coach de Mensagem, Análise de Reunião, Simulador de Treino).
          </p>
          <p>
            Quando você usa essas funcionalidades, <strong>o texto que você envia é processado pelo Google</strong>
            de acordo com a{' '}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
              política de uso da API do Gemini
            </a>.
          </p>
          <p>
            <strong>Recomendamos não incluir dados sensíveis</strong> (CPF, senhas, dados bancários, informações
            confidenciais de clientes) nas conversas com a IA.
          </p>
        </section>

        <section>
          <h3>5. Notícias</h3>
          <p>
            As notícias exibidas são coletadas do <strong>Google News</strong> de forma pública,
            filtradas pelo seu segmento. Não coletamos nada sobre quais notícias você lê.
          </p>
        </section>

        <section>
          <h3>6. Compartilhamento de dados</h3>
          <p>
            <strong>Seus dados são seus.</strong> Nenhum outro usuário — incluindo administradores — tem acesso
            aos seus dados de vendas, tarefas ou perfil. Cada conta é isolada e protegida por regras de segurança.
          </p>
          <p>
            A única exceção é o texto enviado deliberadamente à API do Gemini (Google) quando você usa as funcionalidades de IA.
          </p>
        </section>

        <section>
          <h3>7. Cookies e rastreamento</h3>
          <p>
            <strong>Não usamos cookies de rastreamento nem ferramentas de analytics.</strong>
            O app não monitora seu comportamento.
          </p>
        </section>

        <section>
          <h3>8. Seus direitos (LGPD)</h3>
          <p>Você tem direito a:</p>
          <ul>
            <li><strong>Acessar</strong> todos os seus dados (estão visíveis na tela de Perfil e Histórico)</li>
            <li><strong>Corrigir</strong> seus dados editando no app</li>
            <li><strong>Apagar</strong> seus dados a qualquer momento (limpar dados do navegador, desinstalar, ou apagar entradas de histórico individualmente)</li>
            <li><strong>Não consentir</strong> com uso da IA — basta não usar as funcionalidades de IA</li>
          </ul>
        </section>

        <section>
          <h3>9. Crianças e adolescentes</h3>
          <p>
            O app é destinado a profissionais adultos (18+). Não coletamos intencionalmente dados de menores.
          </p>
        </section>

        <section>
          <h3>10. Alterações nesta política</h3>
          <p>
            Podemos atualizar esta política de tempos em tempos. Mudanças significativas serão comunicadas
            dentro do próprio app. A data da última atualização está no topo desta página.
          </p>
        </section>

        <section>
          <h3>11. Contato</h3>
          <p>
            Dúvidas sobre privacidade? Entre em contato pelo site da{' '}
            <a href="https://gssacademy.vercel.app" target="_blank" rel="noopener noreferrer">
              GSS Academy
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
