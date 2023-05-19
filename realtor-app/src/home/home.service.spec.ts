import { Test, TestingModule } from '@nestjs/testing';
import { HomeService } from './home.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PropertyType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const mockGetHomes = [
  {
    id: 1,
    address: '4567 Yacht Street',
    city: 'Los Angeles',
    price: 350000,
    images: [
      {
        url: 'img1',
      },
    ],
    number_of_bedrooms: 6,
    number_of_bathrooms: 5,
    propert_type: PropertyType.RESIDENTIAL,
  },
];

const mockHome = {
  id: 1,
  address: '4567 Yacht Street',
  city: 'Los Angeles',
  price: 350000,
  number_of_bedrooms: 6,
  number_of_bathrooms: 5,
  propert_type: PropertyType.RESIDENTIAL,
};

const mockImages = [
  {
    id: 1,
    src: 'img_1',
  },
  {
    id: 2,
    src: 'img_2',
  },
];

describe('HomeService', () => {
  let service: HomeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HomeService,
        {
          provide: PrismaService,
          useValue: {
            home: {
              findMany: jest.fn().mockReturnValue(mockGetHomes),
              create: jest.fn().mockReturnValue(mockHome),
            },
            image: {
              createMany: jest.fn().mockReturnValue(mockImages),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HomeService>(HomeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getHomes', () => {
    const filters = {
      city: 'Los Angeles',
      price: {
        gte: 100000,
        lte: 500000,
      },
      propertyType: PropertyType.RESIDENTIAL,
    };

    it('should call prisma find many with correct params', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue(mockGetHomes);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await service.getHomes(filters);

      expect(mockPrismaFindManyHomes).toBeCalledWith({
        select: {
          id: true,
          address: true,
          city: true,
          price: true,
          property_type: true,
          number_of_bathrooms: true,
          number_of_bedrooms: true,
          images: {
            select: {
              url: true,
            },
            take: 1,
          },
        },
        where: {
          ...filters,
        },
      });
    });

    it('should show not found excpetion if homes are not found', async () => {
      const mockPrismaFindManyHomes = jest.fn().mockReturnValue([]);

      jest
        .spyOn(prismaService.home, 'findMany')
        .mockImplementation(mockPrismaFindManyHomes);

      await expect(service.getHomes(filters)).rejects.toThrowError(
        NotFoundException,
      );
    });
  });

  describe('createHome', () => {
    const mockCreateHomeParams = {
      address: '111 Yellow Street',
      numberOfBathrooms: 2,
      numberOfBedrooms: 2,
      city: 'Vancouver',
      landSize: 4444,
      price: 280000,
      propertyType: PropertyType.RESIDENTIAL,
      images: [
        {
          url: 'src1',
        },
      ],
    };
    it('should call prisma home.create with the correct payload', async () => {
      const mockCreateHome = jest.fn().mockReturnValue(mockHome);

      jest
        .spyOn(prismaService.home, 'create')
        .mockImplementation(mockCreateHome);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateHome).toBeCalledWith({
        data: {
          address: '111 Yellow Street',
          number_of_bathrooms: 2,
          number_of_bedrooms: 2,
          city: 'Vancouver',
          price: 280000,
          land_size: 4444,
          property_type: PropertyType.RESIDENTIAL,
          realtor_id: 5,
        },
      });
    });

    it('should call prisma image.createMany with the correct payload', async () => {
      const mockCreateManyImages = jest.fn().mockReturnValue(mockImages);

      jest
        .spyOn(prismaService.image, 'createMany')
        .mockImplementation(mockCreateManyImages);

      await service.createHome(mockCreateHomeParams, 5);

      expect(mockCreateManyImages).toBeCalledWith({
        data: [
          {
            url: 'src1',
            home_id: 1,
          },
        ],
      });
    });
  });
});
