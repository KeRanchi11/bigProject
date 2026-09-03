import { useCallback, useEffect, useMemo, useState } from 'react';
import About from './components/About';
import Dashboard from './components/Admin/Dashboard';
import Login from './components/Admin/Login';
import Contact from './components/Contact';
import FeaturedSlider from './components/FeaturedSlider';
import FontPreview from './components/FontPreview';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import Header from './components/Header';
import Hero from './components/Hero';
import Lightbox from './components/Lightbox';
import PriceCalculator from './components/PriceCalculator';
import SoftBackground from './components/ui/SoftBackground';
import Toast from './components/ui/Toast';
import { useContent } from './hooks/useContent';
import { useLikes } from './hooks/useLikes';
import { useProjects } from './hooks/useProjects';
import { useTheme } from './hooks/useTheme';
import { api } from './lib/api';
import './styles/tokens.css';
import './styles/base.css';

export default function App() {
  const themeProps = useTheme();
  const { content, save, loading: contentLoading } = useContent();
  const projectsHook = useProjects();
  const likes = useLikes();
  const [page, setPage] = useState('home'); // home | price | fonts | admin
  const [toast, setToast] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [admin, setAdmin] = useState(false);

  const notify = useCallback((t) => setToast(t + ' @' + Date.now()), []);

  useEffect(() => {
    api.status().then((j) => setAdmin(!!j.admin)).catch(() => {});
  }, []);

  const scrollTo = useCallback((id) => {
    if (id === 'top') { setPage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (['price', 'fonts', 'admin'].includes(id)) { setPage(id); window.scrollTo({ top: 0 }); return; }
    setPage('home');
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }));
  }, []);

  const allForSlider = useMemo(() => projectsHook.projects, [projectsHook.projects]);
  const selected = selectedId ? allForSlider.find((p) => p.id === selectedId) || null : null;
  const idx = selected ? allForSlider.findIndex((p) => p.id === selected.id) : -1;

  const step = (d) => {
    if (!allForSlider.length) return;
    const n = (idx + d + allForSlider.length) % allForSlider.length;
    setSelectedId(allForSlider[n].id);
  };

  return (
    <div>
      <SoftBackground />
      <Header content={content} themeProps={themeProps} onNav={scrollTo} onAdmin={() => scrollTo('admin')} />

      {page === 'home' && (
        <main className="wrap page flow">
          <Hero content={content} onCta={() => scrollTo('contact')} onGallery={() => scrollTo('gallery')} />
          <FeaturedSlider items={allForSlider} onOpen={setSelectedId} />
          <Gallery hook={projectsHook} likes={likes} onOpen={setSelectedId} notify={notify} />
          <About content={content} />
          <Contact content={content} notify={notify} />
        </main>
      )}
      {page === 'price' && <PriceCalculator content={content} onBack={() => scrollTo('top')} notify={notify} />}
      {page === 'fonts' && <FontPreview content={content} onBack={() => scrollTo('top')} />}
      {page === 'admin' && (
        admin
          ? <Dashboard content={content} notify={notify} onContent={async (patch) => { await save(patch); }} onExit={async () => { await api.logout(); setAdmin(false); scrollTo('top'); }} />
          : <Login notify={notify} onOk={() => { setAdmin(true); notify('خوش آمدید'); }} />
      )}

      <Footer content={content} onAdmin={() => scrollTo('admin')} />

      <Lightbox
        project={selected}
        all={allForSlider}
        liked={selected ? likes.liked.has(selected.id) : false}
        count={selected ? (likes.counts[selected.id] ?? selected.likes) : 0}
        onClose={() => setSelectedId(null)}
        onPrev={() => step(1)}
        onNext={() => step(-1)}
        onLike={() => selected && likes.toggle(selected, selected.likes)}
        whatsapp={content.whatsapp}
      />
      <Toast toast={toast && toast.split(' @')[0]} />
      {contentLoading && <span className="hidden" />}
    </div>
  );
}
