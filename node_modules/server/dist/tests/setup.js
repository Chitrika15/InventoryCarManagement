import mongoose from 'mongoose';
export const setupTestDB = () => {
    const mongoUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/stockdrive_ims_test';
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
        }
    });
    afterEach(async () => {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
        }
    });
    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
};
