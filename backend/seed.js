const mongoose = require('mongoose');
const Book = require('./schemas/book');
const Author = require('./schemas/author');
const Category = require('./schemas/category');

mongoose.connect('mongodb://localhost:27017/bookstore')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

async function seedData() {
  try {
    // Clear existing data
    await Book.deleteMany({});
    await Author.deleteMany({});
    await Category.deleteMany({});

    console.log('Cleared existing data.');

    // Create Sample Authors
    const authors = await Author.insertMany([
      { name: 'Paulo Coelho', bio: 'A Brazilian lyricist and novelist.' },
      { name: 'Stephen Hawking', bio: 'An English theoretical physicist, cosmologist, and author.' },
      { name: 'Daniel Kahneman', bio: 'An Israeli-American psychologist and economist.' },
      { name: 'F. Scott Fitzgerald', bio: 'An American novelist, essayist, and screenwriter.' }
    ]);

    // Create Sample Categories
    const categories = await Category.insertMany([
      { name: 'Văn Học', description: 'Tác phẩm văn học kinh điển và hiện đại.' },
      { name: 'Kỹ Năng', description: 'Sách phát triển bản thân và kỹ năng sống.' },
      { name: 'Thiếu Nhi', description: 'Sách dành cho trẻ em.' },
      { name: 'Học Thuật', description: 'Sách giáo khoa và nghiên cứu.' },
      { name: 'Kinh Điển', description: 'Những tác phẩm vượt thời gian.' }
    ]);

    // Create Sample Books
    await Book.insertMany([
      {
        title: 'Nhà Giả Kim',
        authorId: authors[0]._id,
        categoryId: categories[0]._id,
        price: 89000,
        description: 'Câu chuyện về hành trình đi tìm kho báu của Santiago.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlkjy1j_lyFhqSmsM793siBtIEvyUzfJSwP88hxsObdS7_LgDyYBB2Cnyp3YTtmoK4XRQ75r0iFETF42bYI8H-8G6mqMrryewAfHk1uaQJrd0gP3RF-WNagcmXBtg9-tNxknjJpliIxhAPJ8RKq6IajVqk1-7KT-U7d3ZUmMTEj0wKjuFz9aU4Vcy9IjSCQz4waa2pfyiSRfnvXhxVO1EwHs7qmFFYcd7BFCPZP-rprlSex4Ui0JESin_p3GWhFXz1EchRFeXACw'
      },
      {
        title: 'Lược Sử Thời Gian',
        authorId: authors[1]._id,
        categoryId: categories[3]._id,
        price: 189000,
        description: 'Khám phá những bí ẩn của vũ trụ.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWT4ZA6pcH3qb7e-Qg1gdfSXyeNmdKSNXQmnVpzYqOeztKPRmzGVvE7JUi0kaYdC5fOKfXDccUUiCWZkIY-OIDhO5gDy-QXXyYiL_Pc2spo7mPFz7r-N7FXKIIsWPdbyP10JGcbmuwaWT3F4Uj4BAGNbBtii56Y3XORT-g0FgbbAN68tJC64fnrr2CWaaKfOeAYwwWzIBMeGxr_1mqJbJjFrukV3X7OT5erKwJ_iXvDZSjqNa6oTuG6ydv5BDlXkZ2A7whDE7BXw'
      },
      {
        title: 'Tư Duy Nhanh Và Chậm',
        authorId: authors[2]._id,
        categoryId: categories[1]._id,
        price: 210000,
        description: 'Hai hệ thống điều khiển suy nghĩ của con người.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8-tiuzRVq8rUsdUvJQTA99GhUqzVZog9-Xxpp_8Z7cB8d9q2if7j25BPOKGlRb1bMcdcaYWa2efAMvY_szw7bW5CE2RakuY5xU_s5ZmWOE-cj8-6Q6IHW9GXRsW4fwgFRryPN_5hmmcXyDZ9iRUZW86_j9WBYEptiaw_FJoKP_xQQYDc4ouqLcwgsvOx8Vsf1CCtbBZchijaI5_A43xPyVAyPg1Pu5chFF9Vt3XgZkT-FIzRMdxmVtHsW8rAbc1yNRT1XEKfXjA'
      },
      {
        title: 'The Great Gatsby',
        authorId: authors[3]._id,
        categoryId: categories[4]._id,
        price: 250000,
        description: 'Một bức tranh về xã hội Mỹ những năm 1920.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKx8n5DHS5irNZ-QRBTAg_fzuKUvTHaUieMxXPgIAMYSqYYid8FVjVYxBhLa4bLC9GH-9nk6DP5_Gt63-aJ2lAG7yXczCTzVh6ay-XfN5Mu1Xpfn0hSmgs95WQhgMJ-CMZjQkokqTGOudlWjm0ONwoJsXwjFVTC5fF3x2r3TFkQ08jaRy5WCPxWElJW3ic-zEkbmWz-Bm1tR-i2zWjfIBj2Rw8QfpJa0hCeLCfS7CQ7mLsPeAXVuLndeCI5qMlGnvPRnJuZG4I7Q'
      }
    ]);

    console.log('Sample data seeded successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedData();
