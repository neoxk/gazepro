window.addEventListener('DOMContentLoaded', () => {
  const tabs     = document.querySelectorAll('#tabs button');
  const contents = document.querySelectorAll('.tab-content');

  contents.forEach(c => {
    if (!c.id.includes('editor')) c.classList.add('hidden');
  });

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.remove('hidden');

      document.dispatchEvent(
        new CustomEvent('tab-changed', { detail: btn.dataset.tab })
      );
    });
  });
});
