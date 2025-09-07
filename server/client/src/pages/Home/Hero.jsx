import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { easing } from "maath";
import { Glow, GlowCapture } from "@codaworks/react-glow";

// Component for the moving starfield with brighter stars
function MovingStars() {
  const ref = useRef();

  // This hook runs on every frame
  useFrame((state, delta) => {
    // 1. Continuous Spinning Movement
    ref.current.rotation.x += delta * 0.02; // Slower continuous spin on X
    ref.current.rotation.y += delta * 0.03; // Slightly faster continuous spin on Y

    // 2. Interactive Movement based on mouse position (smoothed)
    // We'll add this to the existing rotation, so it acts as an offset
    // Instead of directly setting rotation, we'll ease towards a target that includes mouse influence
    easing.damp3(
      ref.current.rotation,
      [
        ref.current.rotation.x + state.mouse.y * 0.05, // Add mouse Y influence to X rotation
        ref.current.rotation.y + state.mouse.x * 0.05, // Add mouse X influence to Y rotation
        0
      ],
      0.25, // Smoothing factor
      delta   // Time since last frame
    );
  });

  return (
    <group ref={ref}>
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={7}      // Increased factor for larger stars
        saturation={1}  // Increased saturation for more color
        fade
        speed={1}
      />
    </group>
  );
}


function Hero() {
  const [form, setForm] = useState({
    prompt: "",
    genre: "",
    tone: "",
    audience: ""
  });

  const genreOptions = ["sci-fi", "fantasy", "mystery", "historical", "romance", "horror"];
  const toneOptions = ["dark", "whimsical", "serious", "satirical", "uplifting", "mythic"];
  const audienceOptions = ["young adult", "children", "adult", "general", "educators"];

const promptIdeas = [
  "A linguist deciphers a lost language that speaks directly to the subconscious.",
  "A colony on Mars receives a transmission from Earth… dated 300 years in the future.",
  "A musician discovers that their compositions can alter reality.",
  "A ghost hunter realizes the spirits are trying to protect humanity from something worse.",
  "A teenager inherits a mirror that shows alternate versions of their life—and one starts talking back.",
  "A robot designed for empathy begins dreaming of a world it’s never seen.",
  "A painter’s artwork begins to manifest in the real world, one brushstroke at a time.",
  "A historian finds a journal that rewrites the origin of civilization—and it’s still being updated.",
  "A city built entirely underground starts collapsing as the surface world awakens.",
  "A child’s imaginary friend turns out to be a forgotten deity seeking redemption."
];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateRandomPrompt = () => {
    const random = promptIdeas[Math.floor(Math.random() * promptIdeas.length)];
    setForm((prev) => ({ ...prev, prompt: random }));
    toast.success("Random prompt generated!", {
      icon: "🎲",
      style: {
        background: "#1e293b",
        color: "#facc15",
        border: "1px solid #fbbf24",
        borderRadius: "8px"
      }
    });
  };

  const generateStory = () => {
    const missingField = Object.entries(form).find(([key, value]) => !value.trim());
    if (missingField) {
      toast.error(`Missing field: '${missingField[0]}'`, {
        icon: "⚠️",
        style: {
          borderRadius: "8px",
          background: "#1e293b",
          color: "#f87171",
          border: "1px solid #f87171"
        }
      });
      return;
    }

    localStorage.setItem("storyForm", JSON.stringify(form));
    toast.success("Redirecting to edit page...");
    setTimeout(() => {
      window.location.href = "/edittext";
    }, 1000);
  };

  return (
     // Wrap the entire Hero component's JSX in <GlowCapture>
    <GlowCapture>
      <div className="relative min-h-screen text-white pt-64 bg-slate-900 p-6 overflow-hidden">
        {/* Starfield Background */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <Canvas style={{ height: "100%", width: "100%" }}>
            {/* Fog effect added here */}
            <fog attach="fog" args={['#0f172a', 0, 70]} />
            <MovingStars />
          </Canvas>
        </div>

        {/* Main Content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-center mb-8 text-yellow-300 drop-shadow-lg">
            THE STORY ENGINE
          </h1>

          {/* Wrap the form container div with <Glow> for the border glow effect */}
          <Glow color="#fbbf24"> {/* Use your yellow-400 color for the glow */}
            <div className="max-w-2xl mx-auto glow:border-glow bg-slate-800/50 backdrop-blur-sm border border-slate-600 shadow-xl rounded-lg p-6 space-y-4">
              <div className="flex glow:border-glow gap-2">
                <textarea
                  name="prompt"
                  placeholder="Enter your story prompt here..."
                  value={form.prompt}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="flex-grow px-4 glow:border-glow py-2 border border-slate-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[3rem] max-h-[12rem] overflow-auto bg-slate-900/70 text-gray-200 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={generateRandomPrompt}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold rounded-md shadow-md transition-transform transform hover:scale-105"
                >
                  🎲
                </button>
              </div>

              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border glow:border-glow border-slate-600 rounded-md bg-slate-900/70 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Genre</option>
                {genreOptions.map((g) => (
                  <option key={g} value={g} className="bg-slate-800">
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>

              <select
                name="tone"
                value={form.tone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border glow:border-glow border-slate-600 rounded-md bg-slate-900/70 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Tone</option>
                {toneOptions.map((t) => (
                  <option key={t} value={t} className="bg-slate-800">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                  ))}
              </select>

              <select
                name="audience"
                value={form.audience}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border glow:border-glow border-slate-600 rounded-md bg-slate-900/70 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Select Audience</option>
                {audienceOptions.map((a) => (
                  <option key={a} value={a} className="bg-slate-800">
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={generateStory}
                className="w-full py-3 font-semibold text-slate-900 rounded-md bg-yellow-400 hover:bg-yellow-500 shadow-lg transition-transform transform "
              >
                Generate Story
              </button>
            </div>
          </Glow>
        </div>
      </div>
    </GlowCapture>
  );
}

export default Hero;