import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { User, Category, Product, Order, StockMovement, AuditLog } from '../models/index.js';
export const runSeed = async () => {
    logger.info('🌱 Starting database seed for StockDrive IMS...');
    await connectDB();
    // Clear existing collections
    await Promise.all([
        User.deleteMany({}),
        Category.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({}),
        StockMovement.deleteMany({}),
        AuditLog.deleteMany({}),
    ]);
    logger.info('🧹 Cleaned existing database collections');
    // 1. Seed Users
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
    const admin = await User.create({
        name: 'Admin Commander',
        email: 'admin@stockdrive.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
    });
    const customer = await User.create({
        name: 'Alex Vance',
        email: 'customer@stockdrive.com',
        passwordHash: customerPasswordHash,
        role: 'customer',
    });
    logger.info(`👤 Created users: Admin (${admin.email}), Customer (${customer.email})`);
    // 2. Seed Categories
    const categoriesData = [
        { name: 'Tyres & Alloys', slug: 'tyres-alloys', description: 'High performance radial tyres, off-road wheels, and forged alloys' },
        { name: 'Car Batteries & Inverters', slug: 'batteries-inverters', description: 'Heavy-duty maintenance-free automotive batteries and pure sine wave car inverters' },
        { name: 'Audio & Infotainment', slug: 'audio-infotainment', description: 'Touchscreen head units, Apple CarPlay/Android Auto, subwoofers, and DSP amplifiers' },
        { name: 'Lighting & LEDs', slug: 'lighting-leds', description: 'Ultra-bright projector LED bulbs, fog lamps, ambient neon interior kits, and light bars' },
        { name: 'Seat Covers & Interior', slug: 'seat-covers-interior', description: 'Custom-fit vegan leather seat covers, 7D floor mats, and ergonomic armrests' },
        { name: 'Detailing & Car Care', slug: 'detailing-car-care', description: '9H ceramic coating, foam cannons, dual action polishes, and microfiber essentials' },
    ];
    const categories = await Category.insertMany(categoriesData);
    const catMap = new Map(categories.map((c) => [c.slug, c._id]));
    logger.info(`📁 Created ${categories.length} categories`);
    // 3. Seed 30 Realistic Products (prices in paise, 1 INR = 100 paise)
    const productsData = [
        // Tyres & Alloys
        {
            sku: 'TYR-MIC-001',
            name: 'Michelin Primacy 4 ST 205/55 R16 Tubeless Tyre',
            category: catMap.get('tyres-alloys'),
            brand: 'Michelin',
            price: 920000, // ₹9,200.00
            costPrice: 740000, // ₹7,400.00
            stock: 35,
            reorderLevel: 8,
            description: 'Premium silent rib technology with unmatched wet braking performance and longevity.',
            imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'TYR-BRI-002',
            name: 'Bridgestone Turanza T005 215/60 R17 Radial Tyre',
            category: catMap.get('tyres-alloys'),
            brand: 'Bridgestone',
            price: 1040000, // ₹10,400.00
            costPrice: 820000,
            stock: 4, // LOW STOCK
            reorderLevel: 6,
            description: 'Engineered for luxury sedans and compact SUVs offering superior comfort and low rolling resistance.',
            imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'TYR-MRF-003',
            name: 'MRF Wanderer A/T All-Terrain 235/65 R17 Tyre',
            category: catMap.get('tyres-alloys'),
            brand: 'MRF',
            price: 860000, // ₹8,600.00
            costPrice: 680000,
            stock: 18,
            reorderLevel: 5,
            description: 'Rugged shoulder blocks and reinforced sidewalls designed for hardcore 4x4 trail driving.',
            imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'TYR-ENK-004',
            name: 'Enkei RPF1 Lightweight 17x8 Alloy Wheel Set (Matte Black)',
            category: catMap.get('tyres-alloys'),
            brand: 'Enkei',
            price: 5800000, // ₹58,000.00 (Set of 4)
            costPrice: 4600000,
            stock: 6,
            reorderLevel: 2,
            description: 'MAT technology lightweight motorsport wheels. Dual open-spoke design with superior brake cooling.',
            imageUrl: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'TYR-YOK-005',
            name: 'Yokohama Geolandar G015 265/65 R17 SUV Tyre',
            category: catMap.get('tyres-alloys'),
            brand: 'Yokohama',
            price: 1350000, // ₹13,500.00
            costPrice: 1080000,
            stock: 0, // OUT OF STOCK
            reorderLevel: 4,
            description: 'Severe snow service-rated all-terrain tire with Enduro compound for SUVs and trucks.',
            imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        // Car Batteries & Inverters
        {
            sku: 'BAT-EXI-001',
            name: 'Exide Mileage ML38B20R 35Ah Maintenance Free Battery',
            category: catMap.get('batteries-inverters'),
            brand: 'Exide',
            price: 460000, // ₹4,600.00
            costPrice: 350000,
            stock: 22,
            reorderLevel: 6,
            description: 'Robust design with magic eye indicator. 48-month warranty with instant crank power.',
            imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'BAT-AMA-002',
            name: 'Amaron FLO 42B20L 35Ah High Durability Car Battery',
            category: catMap.get('batteries-inverters'),
            brand: 'Amaron',
            price: 495000, // ₹4,950.00
            costPrice: 380000,
            stock: 3, // LOW STOCK
            reorderLevel: 5,
            description: 'Silven X alloy technology ensures heat resistance and zero maintenance for modern hatchbacks.',
            imageUrl: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'BAT-EXI-003',
            name: 'Exide Epiq 55Ah Heavy Duty Diesel Engine Battery',
            category: catMap.get('batteries-inverters'),
            brand: 'Exide',
            price: 720000, // ₹7,200.00
            costPrice: 560000,
            stock: 14,
            reorderLevel: 4,
            description: 'Designed specifically for heavy diesel engines with rapid charging recovery.',
            imageUrl: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'BAT-LUM-004',
            name: 'Luminous 300W Pure Sine Wave Car Power Inverter (12V to 220V)',
            category: catMap.get('batteries-inverters'),
            brand: 'Luminous',
            price: 299000, // ₹2,990.00
            costPrice: 210000,
            stock: 28,
            reorderLevel: 5,
            description: 'Dual AC output plus QC 3.0 USB ports. Power laptops, camera gear and camp equipment on the go.',
            imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'BAT-NOCO-005',
            name: 'NOCO Boost Plus GB40 1000 Amp 12V UltraSafe Jump Starter',
            category: catMap.get('batteries-inverters'),
            brand: 'NOCO',
            price: 999000, // ₹9,990.00
            costPrice: 750000,
            stock: 12,
            reorderLevel: 3,
            description: 'Compact lithium jump starter with spark-proof tech and reverse polarity protection.',
            imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        // Audio & Infotainment
        {
            sku: 'AUD-PIO-001',
            name: 'Pioneer DMH-Z5350BT 6.8-inch Capacitive Touchscreen',
            category: catMap.get('audio-infotainment'),
            brand: 'Pioneer',
            price: 2690000, // ₹26,900.00
            costPrice: 2100000,
            stock: 15,
            reorderLevel: 4,
            description: 'Apple CarPlay, Android Auto, WebLink, dual Bluetooth and 13-band graphic equalizer.',
            imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'AUD-SNY-002',
            name: 'Sony XAV-AX5500 6.95-inch Bezel-less Media Receiver',
            category: catMap.get('audio-infotainment'),
            brand: 'Sony',
            price: 2850000, // ₹28,500.00
            costPrice: 2280000,
            stock: 2, // LOW STOCK
            reorderLevel: 5,
            description: 'Flush surface display with dual USB ports and Dynamic Stage Organizer sound staging.',
            imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'AUD-JBL-003',
            name: 'JBL Club 6500C 6.5-inch 360W Component Speaker System',
            category: catMap.get('audio-infotainment'),
            brand: 'JBL',
            price: 649000, // ₹6,490.00
            costPrice: 470000,
            stock: 40,
            reorderLevel: 10,
            description: 'Plus One woofer cone architecture with edge-driven silk dome tweeters for crisp vocals.',
            imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'AUD-ALP-004',
            name: 'Alpine SWE-1080 8-inch Powered Compact Underseat Subwoofer',
            category: catMap.get('audio-infotainment'),
            brand: 'Alpine',
            price: 1590000, // ₹15,900.00
            costPrice: 1220000,
            stock: 8,
            reorderLevel: 3,
            description: '160W built-in amplifier with wired remote controller. Fits under virtually any car seat.',
            imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'AUD-INF-005',
            name: 'Infinity Reference 4-Channel Class D Amplifier (Ref 704A)',
            category: catMap.get('audio-infotainment'),
            brand: 'Infinity',
            price: 1390000, // ₹13,900.00
            costPrice: 1050000,
            stock: 11,
            reorderLevel: 3,
            description: 'Compact footprint 1000W peak output with high & low-level inputs for factory integration.',
            imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        // Lighting & LEDs
        {
            sku: 'LGT-OSR-001',
            name: 'Osram LEDriving H4 6000K Cool White Headlight Bulbs (Pair)',
            category: catMap.get('lighting-leds'),
            brand: 'Osram',
            price: 420000, // ₹4,200.00
            costPrice: 310000,
            stock: 45,
            reorderLevel: 8,
            description: 'German engineered high luminous intensity with optimized beam pattern that prevents glare.',
            imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'LGT-PHI-002',
            name: 'Philips Ultinon Pro9000 H7 LED High Performance Fog/Headlight',
            category: catMap.get('lighting-leds'),
            brand: 'Philips',
            price: 890000, // ₹8,900.00
            costPrice: 660000,
            stock: 19,
            reorderLevel: 5,
            description: 'Up to 250% brighter light on the road with Lumileds OEM automotive LED chips.',
            imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'LGT-RIG-003',
            name: 'Rigid Industries 20-inch SR-Series Pro Spot/Flood LED Light Bar',
            category: catMap.get('lighting-leds'),
            brand: 'Rigid Industries',
            price: 2450000, // ₹24,500.00
            costPrice: 1900000,
            stock: 5,
            reorderLevel: 2,
            description: 'Marine-grade extruded aluminum housing with unbreakable polycarbonate lens for off-roaders.',
            imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'LGT-AMB-004',
            name: 'StockDrive Symphony 64-Color App-Controlled Fiber Ambient Interior Kit',
            category: catMap.get('lighting-leds'),
            brand: 'StockDrive Pro',
            price: 349900, // ₹3,499.00
            costPrice: 220000,
            stock: 60,
            reorderLevel: 12,
            description: 'Dynamic gradient symphony flow effects, sound active rhythm syncing with iOS & Android app.',
            imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'LGT-VIP-005',
            name: 'Viper Dual-Color Projector Fog Light Kits with High/Low Solenoid',
            category: catMap.get('lighting-leds'),
            brand: 'Viper',
            price: 680000, // ₹6,800.00
            costPrice: 490000,
            stock: 1, // LOW STOCK
            reorderLevel: 4,
            description: 'Switchable 3000K Golden Yellow for rain/fog and 6000K crisp diamond white for night highway.',
            imageUrl: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        // Seat Covers & Interior
        {
            sku: 'INT-SPA-001',
            name: 'Sparco Corsa Sporty Ergonomic Seat Cover Set (Black & Red)',
            category: catMap.get('seat-covers-interior'),
            brand: 'Sparco',
            price: 799000, // ₹7,990.00
            costPrice: 580000,
            stock: 14,
            reorderLevel: 4,
            description: 'Breathable composite mesh with bolster side support and Italian sport styling.',
            imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'INT-AUT-002',
            name: 'Autoform Nappa-Grain Perforated Custom Seat Covers (Tan)',
            category: catMap.get('seat-covers-interior'),
            brand: 'Autoform',
            price: 1450000, // ₹14,500.00
            costPrice: 1050000,
            stock: 9,
            reorderLevel: 3,
            description: 'OEM fitment precision laser cut vegan leather with high density foam cushioning.',
            imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'INT-MAT-003',
            name: 'Maxliner All-Weather 7D Dual-Tone Deep Dish Floor Mats',
            category: catMap.get('seat-covers-interior'),
            brand: 'Maxliner',
            price: 480000, // ₹4,800.00
            costPrice: 340000,
            stock: 25,
            reorderLevel: 6,
            description: 'End-to-end raised lips retain spills, dirt, and mud. Detachable curly noodle mat layer included.',
            imageUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'INT-STR-004',
            name: 'MOMO Racing Full Grain Leather Steering Wheel Cover with Grip Insets',
            category: catMap.get('seat-covers-interior'),
            brand: 'MOMO',
            price: 185000, // ₹1,850.00
            costPrice: 120000,
            stock: 32,
            reorderLevel: 8,
            description: 'Anti-slip rubber core lined with soft cowhide leather for sublime tactile control.',
            imageUrl: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'INT-SUN-005',
            name: 'StockDrive Magnetic Zippered Sunshade Mesh Set (All Windows)',
            category: catMap.get('seat-covers-interior'),
            brand: 'StockDrive Pro',
            price: 199000, // ₹1,990.00
            costPrice: 130000,
            stock: 45,
            reorderLevel: 10,
            description: 'High-strength magnetic border snaps right onto door frames. Blocks 95% harmful UV rays.',
            imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        // Detailing & Car Care
        {
            sku: 'DET-3M-001',
            name: '3M Perfect-It Fast Cut Plus Extreme Polishing Compound 1kg',
            category: catMap.get('detailing-car-care'),
            brand: '3M',
            price: 245000, // ₹2,450.00
            costPrice: 175000,
            stock: 30,
            reorderLevel: 5,
            description: 'Aggressive abrasive compound quickly removes P1500 grade scratches and severe oxidation.',
            imageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'DET-MEG-002',
            name: "Meguiar's Ultimate Liquid Wax 473ml with Applicator & Towel",
            category: catMap.get('detailing-car-care'),
            brand: "Meguiar's",
            price: 220000, // ₹2,200.00
            costPrice: 160000,
            stock: 22,
            reorderLevel: 5,
            description: 'ThinFilm technology applies effortlessly even in direct sun. Produces mirror-like synthetic shine.',
            imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'DET-GYE-003',
            name: 'GYEON Q2 Syncro EVO 9H Dual-Stage Ceramic Quartz Coating Kit',
            category: catMap.get('detailing-car-care'),
            brand: 'Gyeon',
            price: 890000, // ₹8,900.00
            costPrice: 650000,
            stock: 8,
            reorderLevel: 2,
            description: 'Extreme hydrophobic self-cleaning with unmatched chemical resistance up to 50 months.',
            imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'DET-CHE-004',
            name: 'Chemical Guys TORQ Professional Big Mouth Foam Cannon',
            category: catMap.get('detailing-car-care'),
            brand: 'Chemical Guys',
            price: 479900, // ₹4,799.00
            costPrice: 340000,
            stock: 16,
            reorderLevel: 4,
            description: 'Brass core pressure washer foam cannon produces thick shaving cream snow foam for touchless washes.',
            imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
        {
            sku: 'DET-THE-005',
            name: 'The Rag Company Edgeless 500 GSM Korean Microfiber Towels (Pack of 5)',
            category: catMap.get('detailing-car-care'),
            brand: 'The Rag Company',
            price: 155000, // ₹1,550.00
            costPrice: 98000,
            stock: 50,
            reorderLevel: 10,
            description: 'Zero scratches guaranteed. 70/30 blend plush split microfiber for buffing coatings and drying.',
            imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=600&q=80',
            isActive: true,
        },
    ];
    const products = await Product.insertMany(productsData);
    logger.info(`📦 Created ${products.length} products`);
    // 4. Initial Stock Movements for all products
    const stockMovements = products.map((prod) => ({
        product: prod._id,
        type: 'IN',
        quantity: prod.stock,
        previousStock: 0,
        newStock: prod.stock,
        reason: 'Initial warehouse intake for launch inventory',
        createdBy: admin._id,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    }));
    await StockMovement.insertMany(stockMovements);
    logger.info(`📊 Recorded ${stockMovements.length} initial stock movements`);
    // 5. Historical Orders to populate charts, order ledger, and reports
    const pMichelin = products.find((p) => p.sku === 'TYR-MIC-001');
    const pExide = products.find((p) => p.sku === 'BAT-EXI-001');
    const pPioneer = products.find((p) => p.sku === 'AUD-PIO-001');
    const pOsram = products.find((p) => p.sku === 'LGT-OSR-001');
    const pSparco = products.find((p) => p.sku === 'INT-SPA-001');
    const pWax = products.find((p) => p.sku === 'DET-MEG-002');
    const shippingAddr = {
        fullName: 'Alex Vance',
        addressLine1: '402 Apex Horizon Towers, Sector 14',
        addressLine2: 'Near Cyber Gateway',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '+91 98765 43210',
    };
    const sampleOrders = [
        // Delivered order 20 days ago
        {
            orderNumber: 'SD-20260920-001',
            customer: customer._id,
            items: [
                {
                    product: pMichelin._id,
                    name: pMichelin.name,
                    sku: pMichelin.sku,
                    unitPrice: pMichelin.price,
                    quantity: 2,
                },
                {
                    product: pWax._id,
                    name: pWax.name,
                    sku: pWax.sku,
                    unitPrice: pWax.price,
                    quantity: 1,
                },
            ],
            totalAmount: pMichelin.price * 2 + pWax.price * 1,
            shippingAddress: shippingAddr,
            status: 'DELIVERED',
            statusHistory: [
                { status: 'PENDING', at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), by: customer._id, note: 'Order placed by customer' },
                { status: 'PROCESSING', at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), by: admin._id, note: 'Payment verified and items packed' },
                { status: 'SHIPPED', at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), by: admin._id, note: 'Dispatched via BlueDart Express' },
                { status: 'DELIVERED', at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), by: admin._id, note: 'Delivered and signed by customer' },
            ],
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        // Shipped order 8 days ago
        {
            orderNumber: 'SD-20261001-002',
            customer: customer._id,
            items: [
                {
                    product: pPioneer._id,
                    name: pPioneer.name,
                    sku: pPioneer.sku,
                    unitPrice: pPioneer.price,
                    quantity: 1,
                },
                {
                    product: pOsram._id,
                    name: pOsram.name,
                    sku: pOsram.sku,
                    unitPrice: pOsram.price,
                    quantity: 2,
                },
            ],
            totalAmount: pPioneer.price * 1 + pOsram.price * 2,
            shippingAddress: shippingAddr,
            status: 'SHIPPED',
            statusHistory: [
                { status: 'PENDING', at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), by: customer._id, note: 'Order placed' },
                { status: 'PROCESSING', at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), by: admin._id, note: 'Quality inspection passed' },
                { status: 'SHIPPED', at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), by: admin._id, note: 'In transit to distribution hub' },
            ],
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        // Processing order 2 days ago
        {
            orderNumber: 'SD-20261007-003',
            customer: customer._id,
            items: [
                {
                    product: pExide._id,
                    name: pExide.name,
                    sku: pExide.sku,
                    unitPrice: pExide.price,
                    quantity: 1,
                },
                {
                    product: pSparco._id,
                    name: pSparco.name,
                    sku: pSparco.sku,
                    unitPrice: pSparco.price,
                    quantity: 1,
                },
            ],
            totalAmount: pExide.price * 1 + pSparco.price * 1,
            shippingAddress: shippingAddr,
            status: 'PROCESSING',
            statusHistory: [
                { status: 'PENDING', at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), by: customer._id, note: 'Order placed' },
                { status: 'PROCESSING', at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), by: admin._id, note: 'Assigned to packing bay #3' },
            ],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        // Pending order placed today
        {
            orderNumber: 'SD-20261009-004',
            customer: customer._id,
            items: [
                {
                    product: pOsram._id,
                    name: pOsram.name,
                    sku: pOsram.sku,
                    unitPrice: pOsram.price,
                    quantity: 1,
                },
            ],
            totalAmount: pOsram.price * 1,
            shippingAddress: shippingAddr,
            status: 'PENDING',
            statusHistory: [
                { status: 'PENDING', at: new Date(), by: customer._id, note: 'Order initiated with mock payment' },
            ],
            createdAt: new Date(),
        },
    ];
    await Order.insertMany(sampleOrders);
    logger.info(`🛒 Created ${sampleOrders.length} realistic historical orders`);
    // Add stock movement records for sold orders
    const soldMovements = [
        {
            product: pMichelin._id,
            type: 'OUT',
            quantity: 2,
            previousStock: 37,
            newStock: 35,
            reason: 'Order fulfillment: SD-20260920-001',
            createdBy: customer._id,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
            product: pPioneer._id,
            type: 'OUT',
            quantity: 1,
            previousStock: 16,
            newStock: 15,
            reason: 'Order fulfillment: SD-20261001-002',
            createdBy: customer._id,
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
    ];
    await StockMovement.insertMany(soldMovements);
    // Initial audit log
    await AuditLog.create({
        actor: admin._id,
        action: 'SYSTEM_INITIALIZED',
        entity: 'System',
        entityId: 'seed',
        meta: {
            usersCount: 2,
            categoriesCount: categories.length,
            productsCount: products.length,
            ordersCount: sampleOrders.length,
        },
        createdAt: new Date(),
    });
    logger.info('🎉 StockDrive IMS database seed completed successfully!');
};
// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
    runSeed()
        .then(async () => {
        await disconnectDB();
        process.exit(0);
    })
        .catch(async (err) => {
        logger.error({ err }, 'Seed execution failed');
        await disconnectDB();
        process.exit(1);
    });
}
