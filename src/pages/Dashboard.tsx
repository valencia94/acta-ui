import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Button,
  Stack,
  Heading,
  Text,
} from "@chakra-ui/react";
import {
  listProjects,
  extractProjectData,
  getDownloadUrl,
  sendApprovalEmail,
} from "@/services/actaApi";

interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await listProjects();
      setProjects(res.data);
    })();
  }, []);

  const handleGenerate = async () => {
    if (!activeId) return;
    setBusy(true);
    await extractProjectData(activeId);
    setBusy(false);
  };

  const handleDownload = async () => {
    if (!activeId) return;
    window.open(await getDownloadUrl(activeId, "pdf"), "_blank");
  };

  const handleSend = async () => {
    if (!activeId) return;
    setBusy(true);
    await sendApprovalEmail({
      actaId: activeId,
      clientEmail: "client@example.com",
    });
    setBusy(false);
  };

  return (
    <Stack p={8} spacing={8}>
      <Heading bgGradient="linear(to-r, #1b6738, #4ac795)" bgClip="text">
        Project dashboard
      </Heading>

      <Stack direction="row" flexWrap="wrap" spacing={4}>
        {projects.map((p) => (
          <Card
            key={p.id}
            borderWidth={activeId === p.id ? 2 : 1}
            borderColor={activeId === p.id ? "#4ac795" : "gray.200"}
            onClick={() => setActiveId(p.id)}
            cursor="pointer"
            w="300px"
          >
            <CardBody>
              <Heading size="md">{p.name}</Heading>
              <Text opacity={0.7}>{p.description}</Text>
            </CardBody>
          </Card>
        ))}
      </Stack>

      <Stack direction="row" spacing={4}>
        <Button colorScheme="green" isDisabled={!activeId || busy} onClick={handleGenerate}>
          Generate Acta
        </Button>
        <Button variant="outline" isDisabled={!activeId || busy} onClick={handleDownload}>
          Download
        </Button>
        <Button variant="ghost" isDisabled={!activeId || busy} onClick={handleSend}>
          Send for approval
        </Button>
      </Stack>
    </Stack>
  );
}
