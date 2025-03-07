// Mock report worker for testing
const mockWorker = {
  close: jest.fn(),
  on: jest.fn(),
  processReport: jest.fn()
};

module.exports = mockWorker; 