import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MessageService } from './message.service';
import { Model } from 'mongoose';
import { MessageDocument } from '../models/message.model';
import { SessionDocument } from '../models/session.model';
import { AskLLmService } from '../api-services/ask-llm/ask-llm.service';
import { ChatService } from './chat.service';
import { BullSevice } from './bull.service';
import { ApiService } from '../core/Api/api.service';
import { GateWay } from './gateway.events';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { UpdateMessageBodyDto } from '../dtos/update-message.dto';
import { NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';

describe('MessageService', () => {
  let service: MessageService;
  let messageModel: Model<MessageDocument>;
  let sessionModel: Model<SessionDocument>;
  let llmService: AskLLmService;
  let chatService: ChatService;
  let bullService: BullSevice;
  let apiService: ApiService<MessageDocument, any>;
  let gateway: GateWay;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: getModelToken('Message'),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOneAndUpdate: jest.fn(),
          },
        },
        {
          provide: getModelToken('Session'),
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AskLLmService,
          useValue: {
            sendToLLM: jest.fn(),
          },
        },
        {
          provide: ChatService,
          useValue: {
            sendMessageToLLm: jest.fn(),
          },
        },
        {
          provide: BullSevice,
          useValue: {
            addMessageToQueue: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getAllDocs: jest.fn().mockResolvedValue({
              query: {
                exec: jest.fn().mockResolvedValue([{ body: 'Hello' }]),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
              },
              paginationObj: {
                count: 1,
                numOfPages: 1,
                skip: 0,
                currentPage: 1,
                limit: 10,
              },
            }),
          },
        },
        {
          provide: GateWay,
          useValue: {
            server: {
              to: jest.fn().mockReturnValue({
                emit: jest.fn(),
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
    messageModel = module.get<Model<MessageDocument>>(getModelToken('Message'));
    sessionModel = module.get<Model<SessionDocument>>(getModelToken('Session'));
    llmService = module.get<AskLLmService>(AskLLmService);
    chatService = module.get<ChatService>(ChatService);
    bullService = module.get<BullSevice>(BullSevice);
    apiService = module.get<ApiService<MessageDocument, any>>(ApiService);
    gateway = module.get<GateWay>(GateWay);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getsessionMessages', () => {
    it('should return messages for authorized user', async () => {
      const mockSession = {
        createdBy: '507f1f77bcf86cd799439011', // Valid ObjectId
        participants: [new Types.ObjectId('507f1f77bcf86cd799439011')], // Valid ObjectId
      };
      const mockMessages = [{ body: 'Hello' }];
      const mockPagination = { count: 1, numOfPages: 1, skip: 0, currentPage: 1, limit: 10 };

      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockMessages),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      } as any;
      jest.spyOn(apiService, 'getAllDocs').mockResolvedValue({
        query: mockQuery,
        paginationObj: mockPagination,
      });

      const result = await service.getsessionMessages({}, 1, 10, '507f1f77bcf86cd799439011', 'session-123');
      expect(result[0]).toEqual(mockMessages);
    //   expect(result[1].totalItems).toBe(mockPagination.count);
    });

    it('should throw UnauthorizedException for unauthorized user', async () => {
      const mockSession = {
        createdBy: '507f1f77bcf86cd799439012', // Valid ObjectId
        participants: [],
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      await expect(
        service.getsessionMessages({}, 1, 10, '507f1f77bcf86cd799439011', 'session-123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createMessage', () => {
    it('should create a message and add to queue if LLM is enabled', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: '507f1f77bcf86cd799439011', // Valid ObjectId
        participants: [new Types.ObjectId('507f1f77bcf86cd799439011')], // Valid ObjectId
        enableLLM: true,
        messages: [],
        save: jest.fn(),
      };
      const mockMessage = { id: 'msg-123', sessionId: 'session-123' };
      const mockUser = { userId: '507f1f77bcf86cd799439011', username: 'test-user' };
      const mockCreateMessageDto: CreateMessageDto = {
        sessionId: 'session-123',
        body: 'Hello',
        enableLLM: true,
        llmType: 'gpt-3',
      };

      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);
      jest.spyOn(messageModel, 'create').mockResolvedValue(mockMessage as any);
      jest.spyOn(bullService, 'addMessageToQueue').mockResolvedValue('job-123');

      const result = await service.createMessage(mockCreateMessageDto, mockUser);
      expect(result).toEqual(mockMessage);
      expect(bullService.addMessageToQueue).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session does not exist', async () => {
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(null);

      await expect(
        service.createMessage(
          { sessionId: 'session-123', body: 'Hello', enableLLM: true, llmType: 'gpt-3' },
          { userId: '507f1f77bcf86cd799439011' },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
