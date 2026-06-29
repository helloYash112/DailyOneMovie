import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ShakaPlayer from '../components/player/ShakaPlayer';
import { apiLink } from '../store/moviesThunk';

export default function WatchMovie() {
  const { id } = useParams();
  const manifestUrl = `${apiLink}/movies/${id}/manifest`;
  const movie = useSelector((state) =>
    state.movies.movies.find((m) => String(m.id) === id)
  );

  // Show loading until metadata is available
  if (!movie) return <p>Loading movie...</p>;

  return (
    <div className="p-6 bg-black">
      <ShakaPlayer src={movie.playlistUrl} autoPlay muted={false} />
    </div>
  );
}
