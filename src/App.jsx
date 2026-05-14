import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8080'

function buildAudioUrl(audioUrl) {
  if (!audioUrl) {
    return ''
  }

  if (audioUrl.startsWith('http')) {
    return audioUrl
  }

  return `${API_BASE_URL}${audioUrl}`
}

function formatDuration(seconds) {
  if (!seconds) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function App() {
  const [tracks, setTracks] = useState([])
  const [djs, setDjs] = useState([])
  const [loadingTracks, setLoadingTracks] = useState(true)
  const [loadingDjs, setLoadingDjs] = useState(true)
  const [error, setError] = useState('')
  const [registeringTrackId, setRegisteringTrackId] = useState(null)
  const [activeView, setActiveView] = useState('tracks')

  const totalPlays = useMemo(
    () => tracks.reduce((total, track) => total + track.playCount, 0),
    [tracks],
  )

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [tracksResponse, djsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tracks/published`),
          fetch(`${API_BASE_URL}/api/djs`),
        ])

        if (!tracksResponse.ok) {
          throw new Error('No se pudieron cargar los tracks publicados.')
        }

        if (!djsResponse.ok) {
          throw new Error('No se pudieron cargar los DJs.')
        }

        const [tracksData, djsData] = await Promise.all([tracksResponse.json(), djsResponse.json()])

        setTracks(tracksData)
        setDjs(djsData)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoadingTracks(false)
        setLoadingDjs(false)
      }
    }

    loadDashboardData()
  }, [])

  async function handlePlay(trackId) {
    setRegisteringTrackId(trackId)

    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks/${trackId}/play`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('No se pudo registrar la reproduccion.')
      }

      const updatedTrack = await response.json()
      setTracks((currentTracks) =>
        currentTracks.map((track) => (track.id === updatedTrack.id ? updatedTrack : track)),
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setRegisteringTrackId(null)
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">DL</span>
          <div>
            <strong>DiscoLoop</strong>
            <span>DJ streaming</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Principal">
          <button
            className={activeView === 'tracks' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('tracks')}
          >
            <span>Tracks</span>
          </button>
          <button
            className={activeView === 'djs' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('djs')}
          >
            <span>DJs</span>
          </button>
          <button
            className={activeView === 'activity' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('activity')}
          >
            <span>Actividad</span>
          </button>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Publicados ahora</p>
            <h1>Tracks listos para escuchar</h1>
          </div>
          <div className="stats">
            <span>{tracks.length} tracks</span>
            <span>{djs.length} DJs</span>
            <span>{totalPlays} plays</span>
          </div>
        </header>

        {activeView === 'activity' && (
          <section className="overview-grid">
            <article className="summary-card">
              <p className="eyebrow">DiscoLoop local</p>
              <h2>Tu backend ya esta sirviendo musica desde Spring Boot.</h2>
              <p>Esta vista lee tracks publicados, perfiles DJ y actualiza el contador de plays.</p>
            </article>

            <article className="summary-card compact">
              <span>{tracks.length}</span>
              <p>Tracks publicados</p>
            </article>

            <article className="summary-card compact">
              <span>{djs.length}</span>
              <p>DJs activos</p>
            </article>
          </section>
        )}

        {activeView === 'djs' && (
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Comunidad</p>
                <h2>DJs en DiscoLoop</h2>
              </div>
            </div>

            {loadingDjs && <p className="state-message">Cargando DJs...</p>}
            {error && <p className="state-message error">{error}</p>}
            {!loadingDjs && !error && djs.length === 0 && (
              <p className="state-message">Todavia no hay DJs registrados.</p>
            )}

            <div className="dj-grid">
              {djs.map((dj) => (
                <article className="dj-card" key={dj.id}>
                  <div className="dj-avatar">
                    {dj.photoUrl ? (
                      <img src={dj.photoUrl} alt={`Foto de ${dj.stageName}`} />
                    ) : (
                      <span>{dj.stageName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="dj-info">
                    <h3>{dj.stageName}</h3>
                    <p>{dj.bio || 'Perfil DJ sin bio por ahora.'}</p>
                    <div className="dj-links">
                      {dj.instagramUrl && (
                        <a href={dj.instagramUrl} target="_blank" rel="noreferrer">
                          Instagram
                        </a>
                      )}
                      {dj.soundcloudUrl && (
                        <a href={dj.soundcloudUrl} target="_blank" rel="noreferrer">
                          SoundCloud
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeView === 'tracks' && (
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Catalogo</p>
                <h2>Tracks publicados</h2>
              </div>
            </div>

            {loadingTracks && <p className="state-message">Cargando tracks publicados...</p>}
            {error && <p className="state-message error">{error}</p>}
            {!loadingTracks && !error && tracks.length === 0 && (
              <p className="state-message">Todavia no hay tracks publicados.</p>
            )}

            <div className="track-grid">
              {tracks.map((track) => (
                <article className="track-card" key={track.id}>
                  <div className="cover-art">
                    {track.coverImageUrl ? (
                      <img src={track.coverImageUrl} alt={`Cover de ${track.title}`} />
                    ) : (
                      <span>{track.title.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="track-info">
                    <div>
                      <p className="genre">{track.genre || 'Sin genero'}</p>
                      <h3>{track.title}</h3>
                      <p className="muted">{track.djStageName || 'DJ sin nombre'}</p>
                    </div>

                    <div className="meta-row">
                      <span>{formatDuration(track.durationSeconds)}</span>
                      <span>{track.playCount} plays</span>
                    </div>

                    <div className="player-row">
                      <audio
                        controls
                        src={buildAudioUrl(track.audioUrl)}
                        preload="none"
                        onPlay={() => handlePlay(track.id)}
                      />
                      {registeringTrackId === track.id && <span>Registrando play...</span>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
