// script.js - único arquivo central
// ===============================
// CONFIGURAÇÃO (sua URL e anon key)
const SUPABASE_URL = 'https://vwnzmmyoesrjqpthsstg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3bnptbXlvZXNyanFwdGhzc3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NTIyMTAsImV4cCI6MjA3NzUyODIxMH0.F6z3GoZbC-htwzOZSlOnwZUbVOSbgCSbeFE1qskQihw';

// Inicializa supabase uma vez (singleton)
function getSupabase() {
  if (window.__SUPABASE_CLIENT) return window.__SUPABASE_CLIENT;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase client não encontrado. Verifique se o script do CDN foi carregado antes deste arquivo.');
    return null;
  }
  window.__SUPABASE_CLIENT = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return window.__SUPABASE_CLIENT;
}

document.addEventListener('DOMContentLoaded', function () {
  const supabase = getSupabase();

  // ---------- LOGIN ADMIN POPUP ----------
  const btnEntrar = document.getElementById('btnEntrar');
  const popup = document.getElementById('loginPopup');
  const btnClose = document.getElementById('loginClose');
  const btnLoginConfirm = document.getElementById('loginConfirm');

  if (btnEntrar && popup) {
    btnEntrar.addEventListener('click', () => popup.classList.add('show'));
  }
  if (btnClose && popup) {
    btnClose.addEventListener('click', () => popup.classList.remove('show'));
  }

  if (btnLoginConfirm) {
    btnLoginConfirm.addEventListener('click', () => {
      const u = (document.getElementById('adminUser') || {}).value || '';
      const p = (document.getElementById('adminPass') || {}).value || '';

      // credencial fixa - se for mudar, troque aqui (mantive 'Admin' e '1822br')
      if (u === 'Admin' && p === '1822br') {
        sessionStorage.setItem('adminLogado', 'true');
        popup.classList.remove('show');
        window.location.href = 'admin.html';
      } else {
        alert('Credenciais incorretas');
      }
    });
  }

  // ---------- FAÇA PARTE: FORM ----------
  const form = document.getElementById('formInscricao');
  if (form) {
    const motivoSel = document.getElementById('motivo');
    const campoMotivo = document.getElementById('campoMotivo');
    const notif = document.getElementById('notifOverlay');
    const notifClose = document.getElementById('notifClose');
    const submitBtn = document.getElementById('submitInscricao');

    // mostrar campo "outros"
    if (motivoSel) {
      motivoSel.addEventListener('change', () => {
        if (motivoSel.value === 'outros') campoMotivo.classList.remove('d-none');
        else campoMotivo.classList.add('d-none');
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!supabase) { alert('Serviço indisponível.'); return; }

      // desabilita botão pra evitar double-submit
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';

      const data = {
        nome: (document.getElementById('nome') || {}).value?.trim() || '',
        idade: (document.getElementById('idade') || {}).value?.trim() || '',
        documento: (document.getElementById('documento') || {}).value?.trim() || '',
        telefone: (document.getElementById('telefone') || {}).value?.trim() || '',
        email: (document.getElementById('email') || {}).value?.trim() || '',
        area: (document.getElementById('area') || {}).value || '',
        motivo: (document.getElementById('motivo') || {}).value || '',
        descricao: (document.getElementById('descricao') || {}).value?.trim() || ''
      };

      // validações mínimas
      if (!data.nome || !data.documento || !data.email || !data.area) {
        showFormError('Por favor, preencha os campos obrigatórios.');
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        return;
      }

      try {
        // insert
        const { error } = await supabase.from('inscricoes').insert([data]).select();
        if (error) {
          console.error('Insert error:', error);
          showFormError('Erro ao enviar. Tente novamente.');
        } else {
          // mostra notificação bonita
          if (notif) notif.classList.add('show');
          form.reset();
          campoMotivo.classList.add('d-none');
        }
      } catch (err) {
        console.error(err);
        showFormError('Erro inesperado.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
    });

    if (notifClose) {
      notifClose.addEventListener('click', () => {
        const n = document.getElementById('notifOverlay');
        if (n) n.classList.remove('show');
      });
    }
  }

  // helper para erro do formulário
  function showFormError(msg) {
    const formEl = document.getElementById('formInscricao');
    if (!formEl) { alert(msg); return; }
    const oldMsg = document.querySelector('.form-error');
    if (oldMsg) oldMsg.remove();
    const el = document.createElement('div');
    el.className = 'form-error';
    el.textContent = msg;
    formEl.querySelector('button[type="submit"]').insertAdjacentElement('afterend', el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---------- ADMIN PAGE ----------
  // só executa se estivermos no admin.html
  if (window.location.pathname.split('/').pop() === 'admin.html') {
    // exige login
    if (sessionStorage.getItem('adminLogado') !== 'true') {
      alert('Acesso restrito: faça login.');
      window.location.href = 'index.html';
      return;
    }

    const status = document.getElementById('status');
    const container = document.getElementById('cardsContainer');
    const filtro = document.getElementById('filtroArea');
    const btnExcluirAll = document.getElementById('btnExcluirAll');
    const btnVoltar = document.getElementById('btnVoltar');

    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
        sessionStorage.removeItem('adminLogado');
        window.location.href = 'index.html';
      });
    }

    async function carregarInscricoes(area = 'todos') {
      if (!supabase) {
        status.textContent = 'Supabase não inicializado.';
        return;
      }
      try {
        status.textContent = 'Carregando dados...';
        const { data, error } = await supabase.from('inscricoes')
          .select('*')
          .order('id', { ascending: false });

        if (error) {
          console.error(error);
          status.textContent = 'Erro ao carregar dados.';
          return;
        }

        // filtra localmente (campo area armazenado em minúsculas)
        const filtrados = (area === 'todos') ? data : data.filter(d => (d.area || '').toLowerCase() === area.toLowerCase());

        if (!filtrados || filtrados.length === 0) {
          container.innerHTML = '<tr><td colspan="9" style="padding:16px;color:#666">Nenhum registro.</td></tr>';
          status.textContent = 'Pronto.';
          return;
        }

        container.innerHTML = '';
        filtrados.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.nome)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.idade)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.documento)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.telefone)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.email)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.area)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.motivo)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.descricao)}</td>
            <td style="padding:10px;border-bottom:1px solid #eee">
              <button class="btn-outline-success" data-id="${item.id}" style="padding:6px 8px">Excluir</button>
            </td>
          `;
          container.appendChild(tr);
        });

        // vincula botões de excluir por linha
        container.querySelectorAll('button[data-id]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (!confirm('Excluir este registro?')) return;
            const { error } = await supabase.from('inscricoes').delete().eq('id', id);
            if (error) {
              alert('Erro ao excluir');
              console.error(error);
            } else {
              carregarInscricoes(filtro ? filtro.value : 'todos');
            }
          });
        });

        status.textContent = `Pronto — ${filtrados.length} registro(s).`;
      } catch (err) {
        console.error(err);
        status.textContent = 'Erro inesperado ao carregar.';
      }
    }

    // filtro
    if (filtro) {
      filtro.addEventListener('change', () => carregarInscricoes(filtro.value));
    }

    // exporta e exclui todos (formatado)
    if (btnExcluirAll) {
      btnExcluirAll.addEventListener('click', async () => {
        if (!confirm('Exportar e excluir todos os registros?')) return;
        try {
          const { data, error } = await supabase.from('inscricoes').select('*').order('id', { ascending: true });
          if (error) { alert('Erro ao ler registros'); console.error(error); return; }
          if (!data || data.length === 0) { alert('Nenhum registro para exportar.'); return; }

          const txt = data.map(d => {
            return `Nome: ${d.nome || ''}
Idade: ${d.idade || ''}

ID: ${d.documento || ''}

Tel: ${d.telefone || ''}

Email: ${d.email || ''}

Onde quer servir: ${d.area || 'Não informado'}

Motivo: ${d.motivo || ''}${d.descricao ? ' - ' + d.descricao : ''}

Enviado: ${d.enviado_em ? new Date(d.enviado_em).toLocaleString() : ''}

------------------------------
`;
          }).join('\n');

          // cria download
          const blob = new Blob([txt], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'backup_inscricoes_' + new Date().toISOString().slice(0, 10) + '.txt';
          document.body.appendChild(a);
          a.click();
          a.remove();

          // deleta todos
          const { error: delErr } = await supabase.from('inscricoes').delete().neq('id', -1); // delete all rows
          if (delErr) {
            alert('Erro ao excluir registros.');
            console.error(delErr);
          } else {
            alert('Exportado e excluído.');
            carregarInscricoes(filtro ? filtro.value : 'todos');
          }

        } catch (err) {
          console.error(err);
          alert('Erro inesperado.');
        }
      });
    }

    // inicia com todos
    carregarInscricoes('todos');
  }

  // escapeHtml helper
  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
});

// === CARROSSEL ROBUSTO PARA operacoes.html ===
(function initOperacoesCarousel() {
  // espera DOM
  document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.operacoes-page .carousel');
    if (!carousel) {
      console.warn('[CAROUSEL] elemento .carousel não encontrado na página de operações.');
      return;
    }

    const cards = Array.from(carousel.querySelectorAll('.card'));
    if (cards.length === 0) {
      console.warn('[CAROUSEL] sem .card dentro do .carousel.');
      return;
    }

    // busca botões com mais tolerância (caso IDs duplicados, attach em todos)
    const prevBtn = document.getElementById('prevBtn') || document.querySelector('.carousel-btn.left');
    const nextBtns = Array.from(document.querySelectorAll('#nextBtn')).length
      ? Array.from(document.querySelectorAll('#nextBtn'))
      : Array.from(document.querySelectorAll('.carousel-btn.right'));

    const indicatorsWrapper = document.querySelector('.carousel-indicators');

    // compute gap between cards
    function getGap() {
      const s = getComputedStyle(carousel);
      const gap = parseInt(s.gap || s.columnGap || 20, 10);
      return isNaN(gap) ? 20 : gap;
    }

    // card width (assume all same)
    function cardWidth() {
      return cards[0].offsetWidth;
    }

    function cardWidthWithGap() {
      return cardWidth() + getGap();
    }

    // compute per page based on available width
    function perPageCount() {
      const parentW = carousel.parentElement.clientWidth;
      const cw = cardWidthWithGap();
      // safeguard: if cw is 0 (imgs not loaded) return 1
      if (!cw || cw <= 0) return 1;
      const per = Math.max(1, Math.floor(parentW / cw));
      return per;
    }

    let currentPage = 0;
    function pagesCount() {
      const per = perPageCount();
      return Math.max(1, Math.ceil(cards.length / per));
    }

    // build / update dots
    function rebuildDots() {
      if (!indicatorsWrapper) return;
      const pages = pagesCount();
      if (indicatorsWrapper.children.length !== pages) {
        indicatorsWrapper.innerHTML = '';
        for (let i = 0; i < pages; i++) {
          const dot = document.createElement('span');
          dot.className = 'dot' + (i === currentPage ? ' active' : '');
          dot.dataset.page = i;
          indicatorsWrapper.appendChild(dot);
          dot.addEventListener('click', () => {
            currentPage = i;
            scrollToPage();
          });
        }
      } else {
        Array.from(indicatorsWrapper.children).forEach((el, i) => {
          el.classList.toggle('active', i === currentPage);
        });
      }
    }

    function clampPage(p) {
      const max = pagesCount() - 1;
      if (p < 0) return 0;
      if (p > max) return max;
      return p;
    }

    function scrollToPage(animate = true) {
      // calculate offset in px
      const per = perPageCount();
      const translate = currentPage * per * cardWidthWithGap();
      // apply transform
      carousel.style.transition = animate ? 'transform 0.45s ease' : 'none';
      carousel.style.transform = `translateX(-${translate}px)`;

      // update dots
      if (indicatorsWrapper) {
        Array.from(indicatorsWrapper.children).forEach((el, i) => {
          el.classList.toggle('active', i === currentPage);
        });
      }

      // enable/disable prev/next if you want (optional)
      if (prevBtn) prevBtn.disabled = currentPage <= 0;
      nextBtns.forEach(nb => nb.disabled = currentPage >= pagesCount() - 1);
    }

    // attach button handlers (prev once, next for all found)
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentPage = clampPage(currentPage - 1);
        scrollToPage();
      });
    }

    if (nextBtns.length) {
      nextBtns.forEach(nb => {
        nb.addEventListener('click', () => {
          currentPage = clampPage(currentPage + 1);
          scrollToPage();
        });
      });
    }

    // support keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        currentPage = clampPage(currentPage - 1);
        scrollToPage();
      } else if (e.key === 'ArrowRight') {
        currentPage = clampPage(currentPage + 1);
        scrollToPage();
      }
    });

    // touch swipe
    (function addTouch() {
      let startX = 0, delta = 0, touching = false;
      carousel.addEventListener('touchstart', (ev) => {
        touching = true;
        startX = ev.touches[0].clientX;
        carousel.style.transition = 'none';
      }, { passive: true });
      carousel.addEventListener('touchmove', (ev) => {
        if (!touching) return;
        delta = ev.touches[0].clientX - startX;
        // temporary translate for swipe feel
        const per = perPageCount();
        const base = currentPage * per * cardWidthWithGap();
        carousel.style.transform = `translateX(-${base - delta}px)`;
      }, { passive: true });
      carousel.addEventListener('touchend', () => {
        touching = false;
        if (Math.abs(delta) > 50) {
          if (delta > 0) currentPage = clampPage(currentPage - 1);
          else currentPage = clampPage(currentPage + 1);
        }
        delta = 0;
        scrollToPage();
      });
    })();

    // reflow on resize and when images load
    let initDone = false;
    function recompute(animate = false) {
      // ensure currentPage in bounds
      currentPage = clampPage(currentPage);
      rebuildDots();
      scrollToPage(!animate);
    }

    // Wait images load, then init
    const imgs = carousel.querySelectorAll('img');
    let imgsToLoad = imgs.length;
    if (imgsToLoad === 0) {
      recompute(false);
      initDone = true;
    } else {
      imgs.forEach(img => {
        if (img.complete) {
          imgsToLoad--;
          if (imgsToLoad === 0 && !initDone) { recompute(false); initDone = true; }
        } else {
          img.addEventListener('load', () => {
            imgsToLoad--;
            if (imgsToLoad === 0 && !initDone) { recompute(false); initDone = true; }
          });
          img.addEventListener('error', () => {
            imgsToLoad--;
            if (imgsToLoad === 0 && !initDone) { recompute(false); initDone = true; }
          });
        }
      });
    }

    // on resize, recalc perPage and pages
    let rTO;
    window.addEventListener('resize', () => {
      clearTimeout(rTO);
      rTO = setTimeout(() => {
        // keep same visible content if possible
        recompute(true);
      }, 80);
    });

    // initial build
    rebuildDots();
    scrollToPage(false);

    console.log('[CAROUSEL] inicializado — cards:', cards.length, 'pages:', pagesCount());
  });
})();

