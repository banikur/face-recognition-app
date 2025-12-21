"use client";

export default function CampaignPage() {
  const skinTypes = [
    { id: 1, name: "Oily", description: "Excess sebum production" },
    { id: 2, name: "Dry", description: "Lack of natural moisture" },
    { id: 3, name: "Normal", description: "Balanced skin condition" },
    { id: 4, name: "Combination", description: "Mixed skin zones" },
    { id: 5, name: "Sensitive", description: "Reactive to products" },
  ];

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden" style={{ backgroundColor: '#0F172A' }}>
      {/* Minimal Nav - Logo Left */}
      <nav className="px-8 py-6">
        <div style={{ color: '#FFFFFF', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: '700' }}>
          SkinType
        </div>
      </nav>

      {/* Body Content - Maximized Height, No Scroll */}
      <main className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-5xl">
          {/* Single Column Header */}
          <div className="text-center mb-16">
            <h1 
              style={{ 
                color: '#FFFFFF', 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '3.5rem',
                fontWeight: '700',
                lineHeight: '1.2',
                marginBottom: '1rem'
              }}
            >
              Discover Your Skin Type
            </h1>
            <p 
              className="max-w-2xl mx-auto"
              style={{ 
                color: '#38BDF8', 
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '1rem',
                lineHeight: '1.6'
              }}
            >
              Understand your skin better with our comprehensive categorization system
            </p>
          </div>

          {/* Feature Grid - Max 5 Elements */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {skinTypes.map((type) => (
              <div
                key={type.id}
                className="p-6 border"
                style={{
                  backgroundColor: '#0F172A',
                  borderColor: '#38BDF8',
                  color: '#FFFFFF'
                }}
              >
                <div className="mb-4">
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="#38BDF8" 
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </div>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#FFFFFF'
                  }}
                >
                  {type.name}
                </h3>
                <p 
                  style={{ 
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: '1rem',
                    color: '#38BDF8'
                  }}
                >
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Small Footer */}
      <footer className="px-8 py-4 text-center">
        <p 
          style={{ 
            color: '#38BDF8', 
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '1rem'
          }}
        >
          © 2025 SkinType Campaign
        </p>
      </footer>
    </div>
  );
}

