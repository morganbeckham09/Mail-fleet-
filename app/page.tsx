export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">
          Mail Fleet
        </h1>

        <p className="text-gray-400 text-lg mb-8">
          Your temporary email address, made simple.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-gray-400 mb-3">
            Your temporary email
          </p>

          <div className="bg-gray-800 rounded-xl p-4 text-lg mb-4">
            Generate an email address
          </div>

          <button className="w-full bg-white text-black font-semibold py-3 rounded-xl">
            Generate Email
          </button>
        </div>
      </div>
    </main>
  )
}
