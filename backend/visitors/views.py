from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Visitor
from .Serializer import VisitorSerializer

class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all().order_by('-created_at')
    serializer_class = VisitorSerializer

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in_visitor(self, request, pk=None):
        visitor = self.get_object()
        visitor.check_in = timezone.now()
        visitor.status = 'Checked In'
        visitor.save(update_fields=['check_in', 'status'])
        return Response(self.get_serializer(visitor).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='check-out')
    def check_out_visitor(self, request, pk=None):
        visitor = self.get_object()
        visitor.check_out = timezone.now()
        visitor.status = 'Checked Out'
        visitor.save(update_fields=['check_out', 'status'])
        return Response(self.get_serializer(visitor).data, status=status.HTTP_200_OK)

