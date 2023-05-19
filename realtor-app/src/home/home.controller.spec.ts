import { Test, TestingModule } from '@nestjs/testing';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';

const mockRealtor = {
  id: 8,
  name: 'Ethan',
  email: 'ethan@gmail.com',
  phone: '555 555',
};

const mockHome = {
  id: 1,
  address: '4567 Yacht Street',
  city: 'Los Angeles',
  price: 350000,
  number_of_bedrooms: 6,
  number_of_bathrooms: 5,
  propert_type: PropertyType.RESIDENTIAL,
};

describe('HomeController', () => {
  let controller: HomeController;
  let homeService: HomeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [
        {
          provide: HomeService,
          useValue: {
            getHomes: jest.fn().mockReturnValue([]),
            getRealtorByHomeId: jest.fn().mockReturnValue(mockRealtor),
            updateHomeById: jest.fn().mockReturnValue(mockHome),
          },
        },
        PrismaService,
      ],
    }).compile();

    controller = module.get<HomeController>(HomeController);
    homeService = module.get<HomeService>(HomeService);
  });

  describe('getHomes', () => {
    it('should construct filter object correctly', async () => {
      const mockGetHomes = jest.fn().mockReturnValue([]);

      jest.spyOn(homeService, 'getHomes').mockImplementation(mockGetHomes);

      await controller.getHomes('Toronto', '150000');

      expect(mockGetHomes).toBeCalledWith({
        city: 'Toronto',
        price: {
          gte: 150000,
        },
      });
    });
  });

  describe('updateHome', () => {
    const mockUserInfo = {
      id: 30,
      name: 'Ethan',
      iat: 1,
      exp: 2,
    };

    const mockCreateHomeParams = {
      id: 1,
      address: '4567 Yacht Street',
      city: 'Los Angeles',
      price: 350000,
      number_of_bedrooms: 6,
      number_of_bathrooms: 5,
      propert_type: PropertyType.RESIDENTIAL,
    };

    it('should throw unauth error if realtor didnt create home', async () => {
      await expect(
        controller.updateHome(5, mockCreateHomeParams, mockUserInfo),
      ).rejects.toThrowError(UnauthorizedException);
    });

    it('should update home if realtor id is valid', async () => {
      const mockUpdateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(homeService, 'updateHomeById')
        .mockImplementation(mockUpdateHome);

      await controller.updateHome(5, mockCreateHomeParams, {
        ...mockUserInfo,
        id: 8,
      });

      expect(mockUpdateHome).toBeCalled();
    });
  });
});
