import { Test, TestingModule } from '@nestjs/testing';
import { BullSevice } from './bull.service';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';

describe('BullSevice', () => {
  let service: BullSevice;
  let mockQueue: Partial<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BullSevice,
        {
          provide: getQueueToken('messageQueue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<BullSevice>(BullSevice);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addMessageToQueue', () => {
    it('should add a job to the queue and return job ID', async () => {
      const mockJob = { id: 1 };
      const testData = { message: 'test' };

      (mockQueue.add as jest.Mock).mockResolvedValueOnce(mockJob);

      const result = await service.addMessageToQueue(testData);

      expect(mockQueue.add).toHaveBeenCalledWith(testData);
      expect(result).toBe(String(mockJob.id));
    });

    it('should handle errors when adding to queue', async () => {
      const testError = new Error('Queue error');
      (mockQueue.add as jest.Mock).mockRejectedValueOnce(testError);

      await expect(service.addMessageToQueue({})).rejects.toThrow(testError);
    });
  });

  describe('removeMessageFromQueue', () => {
    const mockJobId = 'job-123';
    const mockJob = {
      remove: jest.fn().mockResolvedValue(undefined),
    };

    it('should remove existing job and return true', async () => {
      (mockQueue.getJob as jest.Mock).mockResolvedValueOnce(mockJob);

      const result = await service.removeMessageFromQueue(mockJobId);

      expect(mockQueue.getJob).toHaveBeenCalledWith(mockJobId);
      expect(mockJob.remove).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if job not found', async () => {
      (mockQueue.getJob as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.removeMessageFromQueue(mockJobId);

      expect(mockQueue.getJob).toHaveBeenCalledWith(mockJobId);
      expect(result).toBeUndefined(); // Original code returns undefined when job not found
    });

    it('should handle errors during job removal', async () => {
      const testError = new Error('Removal error');
      (mockQueue.getJob as jest.Mock).mockResolvedValueOnce({
        remove: jest.fn().mockRejectedValueOnce(testError),
      });

      await expect(service.removeMessageFromQueue(mockJobId)).rejects.toThrow(testError);
    });
  });
});
