/**
 * Shared Mock Data for the Premium Wedding Templates
 */

export const weddingMockData = {
  'tropical-elegance': {
    id: 'demo-tropical',
    tagline: 'Save the Date',
    date: '2026-05-31',
    location: 'Christ Redemption Chapel Int./Anhwiaa',
    couple: {
      bride: {
        name: 'Cecilia',
        image: 'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=600',
        description: 'Cecilia is a creative soul with a love for deep conversations and tropical sunsets.'
      },
      groom: {
        name: 'Sarfo',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600',
        description: 'Sarfo is an adventurous spirit who always brings warmth and laughter to every room.'
      }
    },
    venue: {
      name: 'Christ Redemption Chapel Int.',
      address: 'Anhwiaa',
      description: 'A beautiful chapel providing the perfect sacred space for our union.'
    },
    story: {
      part1: 'Our story began in the most unexpected way. A chance meeting turned into endless conversations, and quickly we realized we had found something incredibly special in each other.',
      highlight: '“In your eyes, I found my home. In your heart, I found my love.”',
      part2: 'Through every season, our bond has only grown stronger. Now, as we prepare to take this beautiful step together, we cannot wait to celebrate our love surrounded by the people who mean the most to us.'
    },
    sliderImages: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?auto=format&fit=crop&q=80&w=800'
    ],
    ceremony: {
      date: '2026-05-31',
      time: '9:00 AM',
      venue: 'Christ Redemption Chapel Int.'
    },
    reception: {
      date: '2026-05-31',
      time: '1:00 PM',
      venue: 'The Grand Tropical Gardens',
      address: 'Anhwiaa Estate'
    },
    dressCode: 'Elegant Tropical / Formal',
    dressCodeDescription: 'Gentlemen in dark or earth-toned suits; Ladies in elegant gowns. Floral or green accents are highly encouraged.',
    dress_code_colors: ['#072417', '#cba052', '#f8f5ed'],
    gifts: [
      { bank: 'Standard Chartered', accountName: 'Sarfo & Cecilia', accountNumber: '1234 567 890', branch: 'Main Branch' }
    ],
    mapLocation: 'https://www.google.com/maps',
    rsvpDeadline: '2026-04-30',
    allowedGuests: ['1', '2', '3']
  },
  'golden-romance': {
    id: 'demo-golden',
    tagline: 'Save the Date',
    date: '2024-08-28',
    location: 'St. Augustine\'s Cathedral, Bantama',
    couple: {
      bride: {
        name: 'Gina',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
        description: 'Gina is a vibrant, compassionate woman with an eye for beauty and a heart full of grace.'
      },
      groom: {
        name: 'Samuel',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
        description: 'Samuel is a grounded and loving partner whose quiet strength anchors their relationship.'
      }
    },
    venue: {
      name: 'St. Augustine\'s Cathedral',
      address: 'Bantama',
      description: 'A historic and breathtaking cathedral filled with warmth and golden light.'
    },
    story: {
      part1: 'Our journey started with a simple shared smile across a crowded room. What started as friendship blossomed into a deep, unshakable love that has become the center of our lives.',
      highlight: '“You are my today and all of my tomorrows.”',
      part2: 'As we step into this new chapter, we reflect on all the golden moments that have brought us here. We cannot wait to make this lifelong commitment with our dearest family and friends by our side.'
    },
    sliderImages: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=800'
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544006659-f0b21f04cb1d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1545232979-8bf34eb9757b?auto=format&fit=crop&q=80&w=800'
    ],
    ceremony: {
      date: '2024-08-28',
      time: '10:00 AM',
      venue: 'St. Augustine\'s Cathedral'
    },
    reception: {
      date: '2024-08-28',
      time: '2:00 PM',
      venue: 'Golden Tulip Royal Reception',
      address: 'Bantama Central'
    },
    dressCode: 'Warm Elegance',
    dressCodeDescription: 'Please wear warm, rich colors (gold, amber, bronze, cream) to match our romantic golden theme.',
    dress_code_colors: ['#c8863b', '#2c1e16', '#fdfbf7'],
    gifts: [
      { bank: 'Absa Bank', accountName: 'Samuel & Gina', accountNumber: '0987 654 321', branch: 'Bantama Branch' }
    ],
    mapLocation: 'https://www.google.com/maps',
    rsvpDeadline: '2024-07-28',
    allowedGuests: ['1', '2']
  }
};
