const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12 });

document.querySelectorAll('.section-head, .pain, .mod, .step, .t-card, .plan, .fid-impact > div, .stat')
  .forEach(el => { el.classList.add('reveal'); io.observe(el); });
