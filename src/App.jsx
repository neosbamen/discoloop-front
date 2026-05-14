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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playingTrackId, setPlayingTrackId] = useState(null)

  const totalPlays = useMemo(
    () => tracks.reduce((total, track) => total + track.playCount, 0),
    [tracks],
  )

  useEffect(() => {
    async function loadPublishedTracks() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tracks/published`)

        if (!response.ok) {
          throw new Error('No se pudieron cargar los tracks publicados.')
        }

        const data = await response.json()
        setTracks(data)
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadPublishedTracks()
  }, [])

  async function handlePlay(trackId) {
    setPlayingTrackId(trackId)

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
      setPlayingTrackId(null)
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
          <a href="#tracks">Tracks</a>
          <a href="#activity">Actividad</a>
          <a href="#library">Biblioteca</a>
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
            <span>{totalPlays} plays</span>
          </div>
        </header>

        <section className="featured-panel" id="activity">
          <div>
            <p className="eyebrow">DiscoLoop local</p>
            <h2>Tu backend ya esta sirviendo musica desde Spring Boot.</h2>
          </div>
          <p>
            Esta vista lee los tracks publicados, reproduce el audio local y actualiza el contador de plays.
          </p>
        </section>

        <section className="track-section" id="tracks">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalogo</p>
              <h2>Tracks publicados</h2>
            </div>
          </div>

          {loading && <p className="state-message">Cargando tracks publicados...</p>}
          {error && <p className="state-message error">{error}</p>}
          {!loading && !error && tracks.length === 0 && (
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

                  <audio controls src={buildAudioUrl(track.audioUrl)} preload="none" />

                  <button
                    className="play-button"
                    type="button"
                    onClick={() => handlePlay(track.id)}
                    disabled={playingTrackId === track.id}
                  >
                    {playingTrackId === track.id ? 'Registrando...' : 'Play'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
