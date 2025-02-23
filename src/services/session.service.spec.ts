import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { SessionService } from './session.service';
import { Model } from 'mongoose';
import { SessionDocument } from '../models/session.model';
import { AskLLmService } from '../api-services/ask-llm/ask-llm.service';
import { CheckUserService } from '../api-services/check-user/check-user.service';
import { ApiService } from '../core/Api/api.service';
import { GateWay } from './gateway.events';
import { CreateSessionDto } from '../dtos/create-session.dto';
import { UpdateSessionRenameDto } from '../dtos/update-session.dto';
import { NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('SessionService', () => {
  let service: SessionService;
  let sessionModel: Model<SessionDocument>;
  let llmService: AskLLmService;
  let checkUserService: CheckUserService;
  let apiService: ApiService<SessionDocument, any>;
  let gateway: GateWay;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getModelToken('Session'),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            findOneAndUpdate: jest.fn(),
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
          provide: CheckUserService,
          useValue: {
            checkUser: jest.fn(),
            checkEmail: jest.fn(),
          },
        },
        {
          provide: ApiService,
          useValue: {
            getAllDocs: jest.fn(),
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

    service = module.get<SessionService>(SessionService);
    sessionModel = module.get<Model<SessionDocument>>(getModelToken('Session'));
    llmService = module.get<AskLLmService>(AskLLmService);
    checkUserService = module.get<CheckUserService>(CheckUserService);
    apiService = module.get<ApiService<SessionDocument, any>>(ApiService);
    gateway = module.get<GateWay>(GateWay);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessageToLLm', () => {
    it('should return LLM response on success', async () => {
      const mockResponse = { success: true, data: 'LLM response' };
      jest.spyOn(llmService, 'sendToLLM').mockResolvedValue(mockResponse);

      const result = await service.sendMessageToLLm('gpt-3', 'Hello');
      expect(result).toBe(mockResponse.data);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      jest.spyOn(llmService, 'sendToLLM').mockResolvedValue({ success: false });

      await expect(service.sendMessageToLLm('gpt-3', 'Hello')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getSessions', () => {
    it('should return sessions with pagination', async () => {
      const mockSessions = [{ title: 'Session 1' }];
      const mockPagination = { count: 1, numOfPages: 1, skip: 0, currentPage: 1, limit: 10 };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockSessions),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      } as any;

      jest.spyOn(apiService, 'getAllDocs').mockResolvedValue({
        query: mockQuery,
        paginationObj: mockPagination,
      });

      const result = await service.getSessions({}, 1, 10);
      expect(result[0]).toEqual(mockSessions);
    //   expect(result[1].totalItems).toBe(mockPagination.count);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions with pagination', async () => {
      const mockSessions = [{ title: 'User Session 1' }];
      const mockPagination = { count: 1, numOfPages: 1, skip: 0, currentPage: 1, limit: 10 };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockSessions),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      } as any;

      jest.spyOn(apiService, 'getAllDocs').mockResolvedValue({
        query: mockQuery,
        paginationObj: mockPagination,
      });

      const result = await service.getUserSessions({}, 1, 10, 'user-123');
      expect(result[0]).toEqual(mockSessions);
    //   expect(result[1].totalItems).toBe(mockPagination.count);
    });
  });

  describe('getparticipatedSessions', () => {
    it('should return sessions where user participated', async () => {
      const mockSessions = [{ title: 'Participated Session 1' }];
      jest.spyOn(sessionModel, 'find').mockResolvedValue(mockSessions);

      const result = await service.getparticipatedSessions('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSessions);
    });

    it('should throw NotFoundException if no sessions found', async () => {
      jest.spyOn(sessionModel, 'find').mockResolvedValue([]);

      await expect(service.getparticipatedSessions('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSession', () => {
    it('should return session if user is authorized', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: '507f1f77bcf86cd799439011',
        participants: [new Types.ObjectId('507f1f77bcf86cd799439011')],
      };
      jest.spyOn(sessionModel, 'findOne').mockResolvedValue(mockSession);

      const result = await service.getSession('session-123', '507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSession);
    });

    it('should throw UnauthorizedException if user is not authorized', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: '507f1f77bcf86cd799439011',
        participants: [],
      };
      jest.spyOn(sessionModel, 'findOne').mockResolvedValue(mockSession);

      await expect(service.getSession('session-123', '507f1f77bcf86cd799439031')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if session does not exist', async () => {
      jest.spyOn(sessionModel, 'findOne').mockResolvedValue(null);

      await expect(service.getSession('session-123', '507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getShareLink', () => {
    it('should return share link if user is creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-123',
        save: jest.fn(),
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      const result = await service.getShareLink('session-123', 'user-123');
      expect(result).toContain('http://localhost:5512/api/v1/session/share/');
    });

    it('should throw UnauthorizedException if user is not creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-456',
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      await expect(service.getShareLink('session-123', 'user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if session does not exist', async () => {
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(null);

      await expect(service.getShareLink('session-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createSession', () => {
    it('should create a session', async () => {
      const mockSession = { _id: 'session-123', title: 'New Session' };
      const mockUser = { userId: 'user-123' };
      const mockCreateSessionDto: CreateSessionDto = { title: 'New Session' };

      jest.spyOn(sessionModel, 'create').mockResolvedValue(mockSession as any);

      const result = await service.createSession(mockCreateSessionDto, mockUser);
      expect(result).toEqual(mockSession);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const mockUser = { userId: 'user-123' };
      const mockCreateSessionDto: CreateSessionDto = { title: 'New Session' };

      jest.spyOn(sessionModel, 'create').mockRejectedValue(new Error('Database error'));

      await expect(service.createSession(mockCreateSessionDto, mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('addParticipantWithEmail', () => {
    it('should add participant if user is creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: '507f1f77bcf86cd799439011',
        participants: [],
        save: jest.fn(),
      };
      const mockUserResult = { success: true, user: { _id: '507f1f77bcf86cd799439013' } };

      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);
      jest.spyOn(checkUserService, 'checkEmail').mockResolvedValue(mockUserResult);

      const result = await service.addParticipantWithEmail('session-123', '507f1f77bcf86cd799439011', 'test@example.com');
      expect(result).toEqual('code sent successfully')
    });

    it('should throw UnauthorizedException if user is not creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-456',
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      await expect(
        service.addParticipantWithEmail('session-123', 'user-123', 'test@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if participant not found', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-123',
      };
      const mockUserResult = { success: false };

      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);
      jest.spyOn(checkUserService, 'checkEmail').mockResolvedValue(mockUserResult);

      await expect(
        service.addParticipantWithEmail('session-123', 'user-123', 'test@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSession', () => {
    it('should delete session if user is creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-123',
        isDelete: false,
        save: jest.fn(),
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      const result = await service.deleteSession('session-123', 'user-123');
      expect(result.isDelete).toBe(true);
    });

    it('should throw UnauthorizedException if user is not creator', async () => {
      const mockSession = {
        _id: 'session-123',
        createdBy: 'user-456',
      };
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(mockSession);

      await expect(service.deleteSession('session-123', 'user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if session does not exist', async () => {
      jest.spyOn(sessionModel, 'findById').mockResolvedValue(null);

      await expect(service.deleteSession('session-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
