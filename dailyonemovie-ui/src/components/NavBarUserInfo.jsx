
import { useSelector } from "react-redux";

export default function NavBarUserInfo() {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null; // nothing if not logged in

  return (
    <div className="flex items-center gap-3">
      <img
        src={user.avatar}
        alt="avatar"
        className="w-10 h-10 rounded-full border border-gray-300"
      />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-gray-900">
          {user.name}
        </span>
        <span className="text-xs text-gray-500">@{user.login}</span>
      </div>
    </div>
  );
}
