/*import { demoUsers } from "@/lib/users";

interface props {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setErorr: (error: string) => void;
}

export default function DemoAcouunts({ setEmail, setPassword, setErorr }:props) {
  const fillDemo = (u: (typeof demoUsers)[0]) => {
    setEmail(u.email);
    setPassword(u.password);
    setErorr("");
  };

  return (
    <div className="mt-5 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
      <p className="text-xs font-semibold text-indigo-300 mb-3 uppercase tracking-wide">
        Demo Accounts — click to fill
      </p>
      <div className="space-y-2">
        {demoUsers.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => fillDemo(u)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-indigo-500/20 hover:border-indigo-500/50 transition text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {u.avatar}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-200 group-hover:text-white transition">
                  {u.name}
                </p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-indigo-400 transition font-mono">
              {u.password}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}*/
