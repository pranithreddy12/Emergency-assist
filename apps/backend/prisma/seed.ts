import { PrismaClient, FacilityCapability, AmbulanceType, AmbulanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Sample dataset around San Francisco (lat/lng), for demo & local dev.
const HOSPITALS = [
  {
    name: 'SF General Trauma Center',
    address: '1001 Potrero Ave, San Francisco, CA',
    phone: '+14152066000',
    latitude: 37.7559,
    longitude: -122.4048,
    rating: 4.3,
    isOpen24h: true,
    hasEmergency: true,
    availableBeds: 12,
    capabilities: [
      FacilityCapability.EMERGENCY,
      FacilityCapability.TRAUMA_CENTER,
      FacilityCapability.STROKE,
    ],
  },
  {
    name: 'Bay Cardiac Institute',
    address: '2200 California St, San Francisco, CA',
    phone: '+14155551200',
    latitude: 37.7899,
    longitude: -122.4324,
    rating: 4.7,
    isOpen24h: true,
    hasEmergency: true,
    availableBeds: 5,
    capabilities: [FacilityCapability.EMERGENCY, FacilityCapability.CARDIAC],
  },
  {
    name: 'Golden Gate Children\'s Hospital',
    address: '600 Divisadero St, San Francisco, CA',
    phone: '+14155559090',
    latitude: 37.7761,
    longitude: -122.4386,
    rating: 4.5,
    isOpen24h: true,
    hasEmergency: true,
    availableBeds: 8,
    capabilities: [FacilityCapability.EMERGENCY, FacilityCapability.PEDIATRIC, FacilityCapability.MATERNITY],
  },
  {
    name: 'Mission Burn & Stroke Unit',
    address: '3555 Cesar Chavez St, San Francisco, CA',
    phone: '+14155553344',
    latitude: 37.7481,
    longitude: -122.4188,
    rating: 4.1,
    isOpen24h: true,
    hasEmergency: true,
    availableBeds: 3,
    capabilities: [FacilityCapability.EMERGENCY, FacilityCapability.BURN, FacilityCapability.STROKE],
  },
  {
    name: 'Sunset Community Clinic',
    address: '1351 24th Ave, San Francisco, CA',
    phone: '+14155557788',
    latitude: 37.7626,
    longitude: -122.4820,
    rating: 3.8,
    isOpen24h: false,
    hasEmergency: false,
    availableBeds: null,
    capabilities: [],
  },
];

const AMBULANCES = [
  { vehicleNumber: 'AMB-101', driverName: 'Ravi Kumar', driverPhone: '+14155550111', type: AmbulanceType.ALS, latitude: 37.7601, longitude: -122.4100 },
  { vehicleNumber: 'AMB-102', driverName: 'Maria Lopez', driverPhone: '+14155550122', type: AmbulanceType.BLS, latitude: 37.7840, longitude: -122.4090 },
  { vehicleNumber: 'AMB-103', driverName: 'James Chen', driverPhone: '+14155550133', type: AmbulanceType.BLS, latitude: 37.7500, longitude: -122.4400 },
  { vehicleNumber: 'AMB-104', driverName: 'Aisha Khan', driverPhone: '+14155550144', type: AmbulanceType.ALS, latitude: 37.7720, longitude: -122.4500 },
];

async function main() {
  for (const h of HOSPITALS) {
    const existing = await prisma.hospital.findFirst({ where: { name: h.name } });
    if (existing) {
      await prisma.hospital.update({ where: { id: existing.id }, data: h });
    } else {
      await prisma.hospital.create({ data: h });
    }
  }
  for (const a of AMBULANCES) {
    await prisma.ambulance.upsert({
      where: { vehicleNumber: a.vehicleNumber },
      update: { ...a, status: AmbulanceStatus.AVAILABLE },
      create: { ...a, status: AmbulanceStatus.AVAILABLE },
    });
  }
  const hc = await prisma.hospital.count();
  const ac = await prisma.ambulance.count();
  // eslint-disable-next-line no-console
  console.log(`Seeded: ${hc} hospitals, ${ac} ambulances`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
