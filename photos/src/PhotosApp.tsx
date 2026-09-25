import { useCallback, useEffect, useState } from 'react'

import { useApps } from '@/contexts/AppsContext.tsx'
import { useSocketMessage } from './shared.tsx'

import styles from './PhotosApp.module.css'

interface AlbumPhoto {
  id: string
  fit?: string
}

const PhotosApp: React.FC = () => {
  const { closeApp } = useApps()
  const [ids, setIds] = useState<string[]>([])
  const [fits, setFits] = useState<Record<string, boolean>>({})
  const [images, setImages] = useState<Record<string, string>>({})
  const [index, setIndex] = useState(0)

  const { ready, socket } = useSocketMessage<{
    photos?: AlbumPhoto[]
    id?: string
    image?: string
  }>('screensaver', (data, action) => {
    if (action === 'album') {
      const photos = data.photos || []
      const nextIds: string[] = []
      const nextFits: Record<string, boolean> = {}
      for (let i = 0; i < photos.length; i += 1) {
        if (photos[i] && photos[i].id) {
          const id = String(photos[i].id)
          nextIds.push(id)
          nextFits[id] = photos[i].fit === 'fit'
        }
      }
      setIds(nextIds)
      setFits(nextFits)
      setIndex(0)
      return
    }
    if (
      (action === 'image' || action === 'photo') &&
      data.id &&
      data.image
    ) {
      setImages(current => ({
        ...current,
        [data.id as string]: data.image as string
      }))
    }
  })

  const requestAlbum = useCallback(() => {
    if (!socket || socket.readyState !== 1) return
    socket.send(
      JSON.stringify({ type: 'screensaver', action: 'getAlbum' })
    )
  }, [socket])

  useEffect(() => {
    if (!ready) return
    requestAlbum()
  }, [ready, requestAlbum])

  useEffect(() => {
    if (!socket || socket.readyState !== 1) return
    const missing = ids.filter(id => !images[id])
    for (let i = 0; i < missing.length; i += 1) {
      socket.send(
        JSON.stringify({
          type: 'screensaver',
          action: 'getImage',
          data: { id: missing[i] }
        })
      )
    }
  }, [ids, images, socket])

  const current = ids[index]
  const image = current ? images[current] : ''

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={closeApp}
        >
          <span className="material-icons">keyboard_arrow_down</span>
        </button>
        <div className={styles.title}>Photos</div>
        <div className={styles.meta}>
          {ids.length ? `${index + 1} / ${ids.length}` : 'Album is empty'}
        </div>
      </div>

      {ids.length === 0 ? (
        <div className={styles.empty}>
          <span className="material-icons">photo_library</span>
          <p>
            Add photos in Settings → Client. They also run as the
            screensaver.
          </p>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.stage}>
            <button
              type="button"
              className={styles.nav}
              disabled={index <= 0}
              onClick={() => setIndex(i => Math.max(0, i - 1))}
            >
              <span className="material-icons">chevron_left</span>
            </button>
            {image ? (
              <img
                src={image}
                alt=""
                className={styles.photo}
                data-fit={fits[current] ? 'fit' : 'fill'}
              />
            ) : (
              <div className={styles.loading}>Loading photo…</div>
            )}
            <button
              type="button"
              className={styles.nav}
              disabled={index >= ids.length - 1}
              onClick={() =>
                setIndex(i => Math.min(ids.length - 1, i + 1))
              }
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
          <div className={styles.strip}>
            {ids.map((id, i) => (
              <button
                key={id}
                type="button"
                className={styles.thumb}
                data-on={i === index}
                onClick={() => setIndex(i)}
              >
                {images[id] ? (
                  <img src={images[id]} alt="" />
                ) : (
                  <span className="material-icons">image</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotosApp
