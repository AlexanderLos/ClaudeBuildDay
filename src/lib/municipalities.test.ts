import { test, expect } from "vitest";
import { allCommunities, ommeContact } from "@/lib/plan";
import { MUNICIPALITY_CENTRES } from "@/lib/municipalities";
test("every marker has communities and an OMME phone", () => {
  for (const { name } of MUNICIPALITY_CENTRES) {
    const n = allCommunities().filter((c) => c.municipality === name);
    expect(n.length).toBeGreaterThan(0);
    expect(ommeContact(name)?.phones.length).toBeGreaterThan(0);
  }
});
