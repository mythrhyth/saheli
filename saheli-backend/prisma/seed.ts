import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding Saheli initial sample fixtures...")

  // 1. Sample Areas (Shillong demo fixtures)
  const sampleAreas = [
    {
      name: "Police Bazaar",
      tone: "caution",
      coverage: "Partial · updated 24 min ago",
      lightingScore: 0.65,
      transportScore: 0.8,
      publicPlacesCount: 8,
      hazardNote: "Heavy rain · IMD",
      confidence: "Moderate",
      isSample: true,
    },
    {
      name: "Laitumkhrah",
      tone: "limited",
      coverage: "Limited · updated 3 h ago",
      lightingScore: 0.45,
      transportScore: 0.5,
      publicPlacesCount: 4,
      hazardNote: "Heavy rain · IMD",
      confidence: "Limited",
      isSample: true,
    },
    {
      name: "Polo",
      tone: "supported",
      coverage: "Good · updated 1 h ago",
      lightingScore: 0.85,
      transportScore: 0.75,
      publicPlacesCount: 6,
      hazardNote: "None active",
      confidence: "High",
      isSample: true,
    },
  ]

  for (const area of sampleAreas) {
    await prisma.areaSafetyData.upsert({
      where: { name: area.name },
      update: area,
      create: area,
    })
  }

  // 2. Sample Shelters
  const sampleShelters = [
    {
      name: "One Stop Centre (Sakhi)",
      type: "Government support centre",
      status: "Confirmed",
      distanceKm: 1.8,
      area: "East Khasi Hills",
      womenOnly: true,
      accessible: true,
      open24: true,
      facilities: JSON.stringify(["Counselling", "Legal aid", "Medical referral", "Temporary stay"]),
      phone: "181",
      accessNotes: "Road access unknown during the rain alert",
      isSample: true,
    },
    {
      name: "District relief camp",
      type: "Disaster relief camp",
      status: "Reported",
      distanceKm: 2.6,
      area: "Laitumkhrah",
      womenOnly: false,
      accessible: true,
      open24: true,
      facilities: JSON.stringify(["Separate women's area", "Drinking water", "First aid"]),
      phone: "112",
      accessNotes: "Reported open by community, not confirmed",
      isSample: true,
    },
    {
      name: "Working women's hostel",
      type: "Hostel",
      status: "Unknown",
      distanceKm: 3.4,
      area: "Polo",
      womenOnly: true,
      accessible: false,
      open24: false,
      facilities: JSON.stringify(["Beds", "Security desk"]),
      phone: null,
      accessNotes: "Availability unknown",
      isSample: true,
    },
  ]

  for (const shelter of sampleShelters) {
    const existing = await prisma.shelter.findFirst({ where: { name: shelter.name } })
    if (!existing) {
      await prisma.shelter.create({ data: shelter })
    }
  }

  // 3. Sample Disaster Alert
  const existingAlert = await prisma.disasterAlert.findFirst({ where: { title: "Heavy rain alert" } })
  if (!existingAlert) {
    await prisma.disasterAlert.create({
      data: {
        title: "Heavy rain alert",
        severity: "warning",
        category: "Weather",
        source: "IMD (Simulated sample feed)",
        active: true,
        area: "East Khasi Hills",
        details: "IMD has issued an orange alert for heavy rain across East Khasi Hills. Low-lying areas and steep slopes may experience waterlogging and minor landslides.",
        isSample: true,
      },
    })
  }

  console.log("✅ Seed completed successfully with sample data clearly labeled.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
