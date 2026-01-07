import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const { searchParams } = new URL(request.url);

        const bride = searchParams.get('bride') || 'Bride';
        const groom = searchParams.get('groom') || 'Groom';
        const date = searchParams.get('date') || '';
        const coverImage = searchParams.get('cover') || '';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f8f4f0',
                        backgroundImage: coverImage ? `url(${coverImage})` : 'linear-gradient(135deg, #269691 0%, #1d857f 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            padding: '60px 80px',
                            borderRadius: '20px',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 72,
                                fontWeight: 700,
                                color: 'white',
                                textAlign: 'center',
                                marginBottom: '20px',
                                fontFamily: 'serif',
                            }}
                        >
                            {bride} & {groom}
                        </div>
                        <div
                            style={{
                                fontSize: 36,
                                color: 'rgba(255, 255, 255, 0.9)',
                                textAlign: 'center',
                                fontStyle: 'italic',
                            }}
                        >
                            We're Getting Married
                        </div>
                        {date && (
                            <div
                                style={{
                                    fontSize: 28,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    marginTop: '20px',
                                    textAlign: 'center',
                                }}
                            >
                                {date}
                            </div>
                        )}
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
