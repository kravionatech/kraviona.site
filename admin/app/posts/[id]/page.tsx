import PostEditor from "../../../components/PostEditor";
export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PostEditor id={(await params).id} />;
}
