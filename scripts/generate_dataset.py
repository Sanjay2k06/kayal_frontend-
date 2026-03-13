import random
from pathlib import Path

import pandas as pd

CATEGORIES = [
    "Agriculture",
    "Education",
    "Women Empowerment",
    "Healthcare",
    "Housing",
    "Business Support",
    "Skill Development",
    "Employment",
    "Social Welfare",
    "Scholarship",
    "Minority Welfare",
    "Disability Support",
    "Senior Citizen Support",
    "Startup Assistance",
    "Livelihood Mission",
    "Child Development",
    "Sports Promotion",
    "Tribal Welfare",
]

STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
]

TARGET_COUNT = 30000

DESCRIPTION_TEMPLATES = [
    "A state-backed initiative supporting {group} through targeted financial and service assistance.",
    "A welfare program designed for {group} to improve access to public services and social protection.",
    "A mission-oriented scheme for {group} focused on inclusive growth and livelihood enhancement.",
    "An official benefit program for {group} that combines financial aid, facilitation, and structured support.",
]

ELIGIBILITY_TEMPLATES = [
    "Applicants from {state}, age between {age_min}-{age_max}, annual income below ₹{income_cap}, and belonging to {group}.",
    "Residents of {state} with valid identity proof, priority for {group}, income not exceeding ₹{income_cap}.",
    "Citizens in {state} meeting socio-economic criteria; suitable for {group} and low-to-middle income households.",
]

BENEFIT_TEMPLATES = [
    "Provides direct assistance up to ₹{amount}, plus access to training, insurance, and advisory services.",
    "Offers subsidy support of ₹{amount} and simplified enrollment for eligible beneficiaries.",
    "Delivers recurring financial support, institutional access, and grievance redress support worth up to ₹{amount}.",
    "Combines a benefit package of up to ₹{amount} with official onboarding support and application tracking.",
]

GROUPS = [
    "small farmers", "women entrepreneurs", "students", "job seekers", "senior citizens",
    "rural households", "urban low-income families", "self-help groups", "micro-business owners",
    "school students", "college students", "working women", "employees", "persons with disabilities",
    "minority communities", "widows", "tribal families", "artisans", "street vendors",
]

DEPARTMENTS = [
    "Ministry of Education",
    "Ministry of Women and Child Development",
    "Ministry of Labour and Employment",
    "Ministry of Agriculture and Farmers Welfare",
    "Ministry of Social Justice and Empowerment",
    "Ministry of Minority Affairs",
    "Ministry of Rural Development",
    "State Welfare Department",
    "Department of Skill Development",
]

APPLICATION_MODES = ["Online", "Offline", "Online and CSC", "District Office", "Portal and Bank Branch"]

DOCUMENT_LIBRARY = [
    "Aadhaar Card",
    "Income Certificate",
    "Domicile Certificate",
    "Bank Passbook",
    "Passport-size Photograph",
    "Caste Certificate",
    "Bonafide Certificate",
    "Disability Certificate",
    "Student ID",
    "Employment Certificate",
    "Ration Card",
    "Mobile Number",
]

GUIDANCE_TEMPLATES = [
    "Visit the official portal, review eligibility carefully, keep all documents ready, and submit the application before the deadline.",
    "Check the department website or district office notice, verify your category and income criteria, and complete Aadhaar-linked verification.",
    "Apply through the official portal or local facilitation center, upload valid documents, and track the application using the reference number.",
]

HELPLINES = ["1800-180-1111", "1800-425-4545", "14434", "14567", "1800-889-0001"]


def generate_row(idx: int) -> dict:
    category = random.choice(CATEGORIES)
    state = random.choice(STATES)
    group = random.choice(GROUPS)
    age_min = random.choice([18, 21, 25, 30])
    age_max = random.choice([45, 50, 55, 60])
    income_cap = random.choice([150000, 250000, 300000, 500000, 800000])
    amount = random.choice([5000, 12000, 25000, 50000, 100000, 200000])
    department = random.choice(DEPARTMENTS)
    application_mode = random.choice(APPLICATION_MODES)
    guidance = random.choice(GUIDANCE_TEMPLATES)
    helpline = random.choice(HELPLINES)
    required_documents = random.sample(DOCUMENT_LIBRARY, k=random.randint(4, 7))

    scheme_name = f"{state} {category} Support Scheme {idx:04d}"
    description = random.choice(DESCRIPTION_TEMPLATES).format(group=group)
    eligibility = random.choice(ELIGIBILITY_TEMPLATES).format(
        state=state,
        age_min=age_min,
        age_max=age_max,
        income_cap=f"{income_cap:,}",
        group=group,
    )
    benefits = random.choice(BENEFIT_TEMPLATES).format(amount=f"{amount:,}")
    official_link = f"https://www.india.gov.in/scheme/{state.lower().replace(' ', '-')}/{idx:04d}"

    return {
        "scheme_name": scheme_name,
        "description": description,
        "eligibility": eligibility,
        "benefits": benefits,
        "category": category,
        "state": state,
        "official_link": official_link,
        "official_department": department,
        "application_mode": application_mode,
        "guidance": guidance,
        "helpline": helpline,
        "required_documents": "; ".join(required_documents),
    }


def main() -> None:
    random.seed(42)
    rows = [generate_row(i + 1) for i in range(TARGET_COUNT)]
    df = pd.DataFrame(rows)

    output_path = Path(__file__).resolve().parents[1] / "data" / "schemes.csv"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} schemes at {output_path}")


if __name__ == "__main__":
    main()
